export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome back, Alex!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Study Hours', value: '12.5', color: 'text-blue-600' },
          { label: 'Active Notes', value: '45', color: 'text-green-600' },
          { label: 'Quizzes Taken', value: '18', color: 'text-purple-600' },
          { label: 'Current Streak', value: '5 days', color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Recent Notes</h2>
          <div className="space-y-4">
            {['Introduction to Psychology', 'Advanced Calculus - Limits', 'Organic Chemistry - Alkanes'].map((note) => (
              <div key={note} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-800">{note}</span>
                <button className="text-blue-600 hover:text-blue-700">Open</button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">Create New Note</button>
            <button className="w-full text-left p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium">Generate New Quiz</button>
            <button className="w-full text-left p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium">Upload Material</button>
          </div>
        </div>
      </div>
    </div>
  );
}
