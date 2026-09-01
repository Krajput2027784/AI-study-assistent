export default function Profile() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile & Settings</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-lg" defaultValue="Alex Smith" />
          <input className="w-full p-3 border rounded-lg" defaultValue="alex@university.edu" />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg">Save Changes</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6">Notifications</h2>
        <label className="flex items-center gap-3"><input type="checkbox" defaultChecked /> Email notifications</label>
      </div>
    </div>
  );
}

