export default function Progress() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Learning Progress</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Study Hours Trend</h2>
          <div className="h-64 bg-gray-50 flex items-end justify-between p-4 rounded-lg">
            {[4, 6, 3, 7, 5, 8, 4].map((h, i) => (
              <div key={i} className="w-10 bg-blue-500 rounded-t" style={{ height: `${h * 10}%` }}></div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Subject Mastery</h2>
          <div className="space-y-4">
            {['Psychology', 'Calculus', 'Chemistry', 'Physics'].map(sub => (
              <div key={sub}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{sub}</span>
                  <span className="text-sm text-gray-500">80%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full"><div className="h-2 bg-green-500 rounded-full" style={{ width: '80%' }}></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
