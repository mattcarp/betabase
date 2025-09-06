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
          className="bg-cyan-400/10 text-cyan-400 text-sm font-mono px-3 py-1 rounded-full border border-cyan-400/20"
        >
          {topic}
        </div>
      ))}
    </div>
  );
};

export default TopicCloud;
