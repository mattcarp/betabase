import React from "react";

interface TopicCloudProps {
  topics: string[];
}

const TopicCloud: React.FC<TopicCloudProps> = ({ topics }) => {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {topics.map((topic, index) => (
        <div
          key={index}
          className="bg-blue-600/10 text-blue-600 text-sm font-mono px-4 py-2 rounded-full border border-blue-600/20"
        >
          {topic}
        </div>
      ))}
    </div>
  );
};

export default TopicCloud;
