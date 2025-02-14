const express = require('express');
const router = express.Router();
// daos
const CategoryDAO = require('../models/CategoryDAO');
const ProductDAO = require('../models/ProductDAO');
// utils
const CryptoUtil = require('../utils/CryptoUtil');
const EmailUtil = require('../utils/EmailUtil');
// utils
const JwtUtil = require('../utils/JwtUtil');
// daos
const CustomerDAO = require('../models/CustomerDAO');
// daos
const OrderDAO = require('../models/OrderDAO');
// category
router.get('/categories', async function (req, res) {
  const categories = await CategoryDAO.selectAll();
  res.json(categories);
});
// product
router.get('/products/new', async function (req, res) {
  const products = await ProductDAO.selectTopNew(3);
  res.json(products);
});
router.get('/products/category/:cid', async function (req, res) {
    const _cid = req.params.cid;
    const products = await ProductDAO.selectByCatID(_cid);
    res.json(products);
  });
router.get('/products/hot', async function (req, res) {
  const products = await ProductDAO.selectTopHot(3);
  res.json(products);
});
router.get('/products/search/:keyword', async function (req, res) {
  const keyword = req.params.keyword;
  const products = await ProductDAO.selectByKeyword(keyword);
  res.json(products);
});
router.get('/products/:id', async function (req, res) {
  const _id = req.params.id;
  const product = await ProductDAO.selectByID(_id);
  res.json(product);
});
//customer
router.post('/signup', async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;
  const resetToken = null;
  const address =null;
  const dbCust = await CustomerDAO.selectByUsernameOrEmail(username, email);
  if (dbCust) {
    res.json({ success: false, message: 'Exists username or email' });
  } else {
    const now = new Date().getTime(); // milliseconds
    const token = CryptoUtil.md5(now.toString());
    const newCust = { username: username, password: password, name: name, phone: phone, email: email, active: 0, token: token,resetToken:resetToken,address:address };
    const result = await CustomerDAO.insert(newCust);
    if (result) {
      const send = await EmailUtil.send(email, result._id, token);
      if (send) {
        res.json({ success: true, message: 'Please check email' });
      } else {
        res.json({ success: false, message: 'Email failure' });
      }
    } else {
      res.json({ success: false, message: 'Insert failure' });
    }
  }
});
router.post('/active', async function (req, res) {
  const _id = req.body.id;
  const token = req.body.token;
  const result = await CustomerDAO.active(_id, token, 1);
  res.json(result);
});
router.post('/login', async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password) {
    const customer = await CustomerDAO.selectByUsernameAndPassword(username, password);
    if (customer) {
      if (customer.active === 1) {
        const token = JwtUtil.genToken();
        res.json({ success: true, message: 'Authentication successful', token: token, customer: customer });
      } else {
        res.json({ success: false, message: 'Account is deactive' });
      }
    } else {
      res.json({ success: false, message: 'Incorrect username or password' });
    }
  } else {
    res.json({ success: false, message: 'Please input username and password' });
  }
});
router.get('/token', JwtUtil.checkToken, function (req, res) {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  res.json({ success: true, message: 'Token is valid', token: token });
});
// myprofile
router.put('/customers/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;
 
  const customer = { _id: _id, username: username, password: password, name: name, phone: phone, email: email };
  const result = await CustomerDAO.update(customer);
  res.json(result);
});

router.put('/address/:id', JwtUtil.checkToken, async function (req, res) {
  const customerId = req.params.id;

  // Assuming the address fields are sent in the request body
  const sonha = req.body.sonha;
  const phuong = req.body.phuong;
  const quan = req.body.quan;
  const thanhpho = req.body.thanhpho;

  const addressUpdate = {
    sonha: sonha,
    phuong: phuong,
    quan: quan,
    thanhpho: thanhpho,
  };

  const resultAddress = await CustomerDAO.updateAddress(customerId, addressUpdate);

  res.json(resultAddress);
});


router.post('/checkout', JwtUtil.checkToken, async function (req, res) {
  const now = new Date().getTime(); // milliseconds
  const total = req.body.total;
  const items = req.body.items;
  const customer = req.body.customer;
  const order = { cdate: now, total: total, status: 'PENDING', customer: customer, items: items };
  const result = await OrderDAO.insert(order);
  res.json(result);
});
// myorders
router.get('/orders/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  const _cid = req.params.cid;
  const orders = await OrderDAO.selectByCustID(_cid);
  res.json(orders);
});



// --------------------------
const NotificationDAO = require('../models/NotificationDAO');
router.get('/notifications', async function (req, res) {
  const notifications = await NotificationDAO.selectAll();
  res.json(notifications);
});

// ----------------------------------
router.post('/reset-password', async function (req, res) {
  const email = req.body.email;
  const dbCust = await CustomerDAO.selectByEmail(email);
  console.log('Result from selectByEmail:', dbCust); // Log the result

  if (!dbCust) {
    res.json({ success: false, message: 'Email not found' });
  } else {
    const now = new Date().getTime(); // milliseconds
    const token = CryptoUtil.md5(now.toString());
    const updateTokenResult = await CustomerDAO.updateResetToken(dbCust._id, token);

    if (updateTokenResult) {
      const send = await EmailUtil.sendToken(email, token);

      if (send) {
        res.json({ success: true, message: 'Please check your email for password reset instructions' });
      } else {
        res.json({ success: false, message: 'Failed to send reset email' });
      }
    } else {
      res.json({ success: false, message: 'Failed to update reset token' });
    }
  }
});
router.post('/comfirm', async function (req, res) {
  const email = req.body.email;
  const token = req.body.token;
  const password = req.body.password; // Assuming the new password is sent in the request

  const result = await CustomerDAO.updatePasswordWithEmailAndToken(email, token, password);
  res.json(result);
  console.log('', result); // Log the result

});





module.exports = router;