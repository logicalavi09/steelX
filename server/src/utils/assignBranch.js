import Branch from "../models/Branch.js";

const assignBranch = async () => {
  const branches = await Branch.find();
  if (!branches.length) return null;
  return branches[Math.floor(Math.random() * branches.length)];
};

export default assignBranch;
