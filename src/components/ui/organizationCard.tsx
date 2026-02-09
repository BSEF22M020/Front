import React from 'react';
import { Users } from 'lucide-react';
import { useRouter } from 'next/router';

interface OrganizationCardProps {
  id: number;
  name: string;
  description: string;
  imagePath?: string;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ id, name, description, imagePath }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/organization/${id}`)} // click pe organization page
      className="cursor-pointer bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl"
    >
      {/* Image */}
      <div className="h-48 w-full overflow-hidden">
        {imagePath ? (
          <img
            src={imagePath}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">{name}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm line-clamp-3">{description}</p>
      </div>
    </div>
  );
};

export default OrganizationCard;
