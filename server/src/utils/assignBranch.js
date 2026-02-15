// import Branch from "../models/Branch.js";

// const assignBranch = async () => {
//   const branches = await Branch.find();
//   if (!branches.length) return null;
//   return branches[Math.floor(Math.random() * branches.length)];
// };

// export default assignBranch;




import Branch from "../models/Branch.js";

const assignBranch = async () => {
  // Filhal pehli available branch utha lo
  const branch = await Branch.findOne();
  return branch;
};

export default assignBranch;