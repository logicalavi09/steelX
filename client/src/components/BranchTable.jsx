export default function BranchTable({ branches }) {
    if (!branches.length)
      return <p>No branches found</p>;
  
    return (
      <table className="w-full mt-4 border">
  
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Name</th>
            <th>Address</th>
            <th>Phone</th>
          </tr>
        </thead>
  
        <tbody>
          {branches.map((b) => (
            <tr key={b._id} className="border-t">
              <td className="p-2">{b.name}</td>
              <td>{b.address}</td>
              <td>{b.phone}</td>
            </tr>
          ))}
        </tbody>
  
      </table>
    );
  }
  