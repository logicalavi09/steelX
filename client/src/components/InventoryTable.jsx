export default function InventoryTable({ data }) {

    if (!data.length)
      return <p>No inventory found</p>;
  
    return (
      <table className="w-full mt-4 border">
  
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Product</th>
            <th>Category</th>
            <th>Stock</th>
          </tr>
        </thead>
  
        <tbody>
          {data.map((i) => (
            <tr key={i._id} className="border-t">
              <td className="p-2">
                {i.product.name}
              </td>
              <td>{i.product.category}</td>
              <td>{i.stock}</td>
            </tr>
          ))}
        </tbody>
  
      </table>
    );
  }
  