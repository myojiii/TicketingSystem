import UserModel from "../models/User.js";

const listUsers = async (req, res) => {
  const userData = await UserModel.find();
  res.json(userData);
};

export { listUsers };
