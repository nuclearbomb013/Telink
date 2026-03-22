/**
 * Developer Card Component
 *
 * Displays an individual developer's profile with avatar, stats, and expertise.
 * Clicking on the avatar navigates to the developer's profile page.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { DeveloperProfile } from '../../services/developer.types';
import UserAvatar from '../Forum/UserAvatar';

interface DeveloperCardProps {
  /** The developer profile to display */
  developer: DeveloperProfile;
  /** Optional CSS classes to add to the card */
  className?: string;
  /** Whether to show the avatar as clickable */
  showClickableAvatar?: boolean;
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({
  developer,
  className = '',
  showClickableAvatar = true,
}) => {
  const {
    id,
    username,
    avatar,
    bio,
    expertise,
    stats,
    skills,
    contributionLevel,
    reputationScore,
    featured,
  } = developer;

  // Format the contribution level for display
  const formatContributionLevel = (level: string): string => {
    const levelMap: { [key: string]: string } = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
      expert: '专家',
      master: '大师',
    };
    return levelMap[level] || level;
  };

  // Determine badge class based on contribution level
  const getLevelBadgeClass = (): string => {
    switch (contributionLevel) {
      case 'master':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'expert':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white';
      case 'advanced':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
      case 'intermediate':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'beginner':
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-none border border-brand-border
        bg-white transition-all duration-500 hover:scale-105 hover:z-10
        cursor-pointer shadow-sm hover:shadow-md
        ${featured ? 'ring-2 ring-amber-400 ring-offset-2' : ''}
        ${className}
      `}
    >
      {/* Developer header with avatar and basic info */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          {showClickableAvatar ? (
            <Link to={`/user/${id}`} className="flex-shrink-0">
              <UserAvatar
                username={username}
                avatarUrl={avatar}
                size="lg"
                clickable={false} // Already wrapped in Link
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </Link>
          ) : (
            <div className="flex-shrink-0">
              <UserAvatar
                username={username}
                avatarUrl={avatar}
                size="lg"
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-oswald font-light text-lg truncate text-brand-text group-hover:text-brand-dark-gray transition-colors">
                {username}
              </h3>
              {featured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  精选
                </span>
              )}
            </div>

            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeClass()} mb-2`}>
              {formatContributionLevel(contributionLevel)}
            </span>

            <p className="text-sm text-brand-light-gray truncate">
              {bio || '暂无简介'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="px-6 py-3 bg-brand-linen/20 border-t border-brand-border/30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="text-center">
            <div className="font-oswald text-brand-text font-light">{stats.projectsCount}</div>
            <div className="text-xs text-brand-light-gray">项目</div>
          </div>
          <div className="text-center">
            <div className="font-oswald text-brand-text font-light">{stats.contributions}</div>
            <div className="text-xs text-brand-light-gray">贡献</div>
          </div>
          <div className="text-center">
            <div className="font-oswald text-brand-text font-light">{reputationScore}</div>
            <div className="text-xs text-brand-light-gray">声望</div>
          </div>
        </div>
      </div>

      {/* Expertise and skills */}
      <div className="p-6 pt-4">
        <div className="mb-3">
          <h4 className="text-xs uppercase tracking-wider text-brand-light-gray mb-2">专长领域</h4>
          <div className="flex flex-wrap gap-1">
            {expertise.slice(0, 3).map((exp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-brand-linen text-brand-dark-gray"
              >
                {exp}
              </span>
            ))}
            {expertise.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-brand-linen text-brand-dark-gray">
                +{expertise.length - 3} 更多
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider text-brand-light-gray mb-2">技能</h4>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-brand-text text-brand-linen"
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-brand-text text-brand-linen">
                +{skills.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action area */}
      <div className="px-6 py-4 bg-brand-linen/10 border-t border-brand-border/20">
        <Link
          to={`/user/${id}`}
          className="
            w-full flex items-center justify-center gap-1
            px-4 py-2 bg-brand-text text-brand-linen
            font-oswald uppercase tracking-wider text-sm
            border border-brand-border
            transition-all duration-300
            hover:bg-transparent hover:text-brand-text
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-text
          "
        >
          查看资料
          <svg
            className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default DeveloperCard;