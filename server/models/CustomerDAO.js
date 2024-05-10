require('../utils/MongooseUtil');
const Models = require('./Models');

const CustomerDAO = {
  async selectByUsernameOrEmail(username, email) {
    const query = { $or: [{ username: username }, { email: email }] };
    const customer = await Models.Customer.findOne(query);
    return customer;
  },
  async insert(customer) {
    const mongoose = require('mongoose');
    customer._id = new mongoose.Types.ObjectId();
    const result = await Models.Customer.create(customer);
    return result;
  },
  async active(_id, token, active) {
    const query = { _id: _id, token: token };
    const newvalues = { active: active };
    const result = await Models.Customer.findOneAndUpdate(query, newvalues, { new: true });
    return result;
  },
  async selectByUsernameAndPassword(username, password) {
    const query = { username: username, password: password };
    const customer = await Models.Customer.findOne(query);
    return customer;
  },
  async update(customer) {
    const newvalues = { username: customer.username, password: customer.password, name: customer.name, phone: customer.phone, email: customer.email };
    const result = await Models.Customer.findByIdAndUpdate(customer._id, newvalues, { new: true });
    return result;
  },
  async updateAddress(customerId, addressUpdate) {
    const newvalues = { address:addressUpdate };
    const result = await Models.Customer.findByIdAndUpdate(customerId, newvalues, { new: true });
    return result;
  },
  async selectAll() {
    const query = {};
    const customers = await Models.Customer.find(query).exec();
    return customers;
  },
  async selectByID(_id) {
    const customer = await Models.Customer.findById(_id).exec();
    return customer;
  },

  async updateResetToken(customerId, token) {
    try {
      const updatedCustomer = await Models.Customer.findByIdAndUpdate(
        customerId,
        { resetToken: token },
        { new: true } // Return the updated document
      );

      return updatedCustomer;
    } catch (error) {
      console.error('Error updating reset token:', error);
      return null;
    }
  },
  async selectByEmail(email) {
    const query = { $or: [ { email: email }] };
    const customer = await Models.Customer.findOne(query);
    return customer;
  },
  async  updatePasswordWithEmailAndToken(email, token, newPassword) {
    try {
      const customer = await Models.Customer.findOne({ email, resetToken: token });
      
      if (!customer) {
        return { success: false, message: 'Invalid email or activation link' };
      }
      // Update the password and other fields
      customer.password = newPassword;
      customer.active = 1; // Assuming you want to activate the account when updating the password
      customer.resetToken = null; // Clear the reset token after updating the password
      const updatedCustomer = await customer.save();
  
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error updating password with email and token:', error);
      return { success: false, message: 'Failed to update password' };
    }
  },
  
};
module.exports = CustomerDAO;