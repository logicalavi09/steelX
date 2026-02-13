import Branch from "../models/Branch.js";

export const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
