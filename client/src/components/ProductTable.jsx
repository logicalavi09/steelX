export default function ProductTable({ products }) {

    if (!products.length)
      return <p>No products found</p>;
  
    return (
      <table className="w-full mt-4 border">
  
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Name</th>
            <th>Category</th>
            <th>Unit</th>
            <th>Price</th>
          </tr>
        </thead>
  
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td>{p.category}</td>
              <td>{p.unit}</td>
              <td>₹ {p.basePrice}</td>
            </tr>
          ))}
        </tbody>
  
      </table>
    );
  }
  