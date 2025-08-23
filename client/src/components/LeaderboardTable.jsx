import React from 'react';
import Avatar from './Avatar';

const LeaderboardTable = ({ leaderboard, mainUser }) => {
  return (
    <div>
      {mainUser && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-lg flex items-center shadow-lg border-2 border-yellow-400">
          <Avatar src={mainUser.profilePic} alt={mainUser.name} size="lg" fallback={mainUser.name?.charAt(0)} />
          <div className="ml-4">
            <div className="text-xl font-bold text-yellow-800">You</div>
            <div className="text-lg font-semibold">{mainUser.name} ({mainUser.rollNo})</div>
            <div className="text-sm text-gray-700">{mainUser.testName || 'No test taken yet'}</div>
            <div className="text-sm text-gray-700">Result: {mainUser.result || '-'}</div>
            <div className="text-sm text-gray-700">Time Spent: {mainUser.timeSpent || 0} min</div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Roll No</th>
              <th className="border px-2 py-1">Branch</th>
              <th className="border px-2 py-1">Test Name</th>
              <th className="border px-2 py-1">Result</th>
              <th className="border px-2 py-1">Time Spent (min)</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => (
              <tr key={entry.userId} className="hover:bg-gray-50">
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1 flex items-center">
                  <Avatar src={entry.profilePic} alt={entry.name} size="sm" fallback={entry.name?.charAt(0)} />
                  <span className="ml-2">{entry.name}</span>
                </td>
                <td className="border px-2 py-1">{entry.rollNo}</td>
                <td className="border px-2 py-1">{entry.branch}</td>
                <td className="border px-2 py-1">{entry.testName || '-'}</td>
                <td className="border px-2 py-1">{entry.result || '-'}</td>
                <td className="border px-2 py-1">{entry.timeSpent || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
