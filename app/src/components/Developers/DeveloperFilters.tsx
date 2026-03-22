/**
 * Developer Filters Component
 *
 * Provides filtering and sorting controls for the developer showcase
 */

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { DeveloperFilter, DeveloperSortOption } from '../../services/developer.types';
import { userService } from '../../services/user.service';

interface DeveloperFiltersProps {
  /** Current filter values */
  currentFilters: DeveloperFilter;
  /** Current sort options */
  currentSort: DeveloperSortOption;
  /** Callback when filters change */
  onFiltersChange: (filters: DeveloperFilter) => void;
  /** Callback when sort options change */
  onSortChange: (sort: DeveloperSortOption) => void;
  /** Function to toggle filter visibility */
  toggleFilters: () => void;
  /** Current visibility state of filters */
  filtersVisible: boolean;
}

export const DeveloperFilters: React.FC<DeveloperFiltersProps> = ({
  currentFilters,
  currentSort,
  onFiltersChange,
  onSortChange,
  toggleFilters,
  filtersVisible,
}) => {
  const [availableExpertise, setAvailableExpertise] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  // Load available filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const expertise = await userService.getDeveloperCategories();
        setAvailableExpertise(expertise);

        // For skills, we'll use a predefined list for now, but in a real implementation
        // this would come from a service call
        setAvailableSkills([
          'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
          'Python', 'Java', 'C#', 'Go', 'Rust', 'GraphQL', 'REST', 'CSS',
          'HTML', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'
        ]);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  // Handle expertise filter change
  const handleExpertiseChange = (expertise: string, checked: boolean) => {
    const newExpertise = checked
      ? [...currentFilters.expertise || [], expertise]
      : (currentFilters.expertise || []).filter(e => e !== expertise);

    onFiltersChange({
      ...currentFilters,
      expertise: newExpertise,
    });
  };

  // Handle skills filter change
  const handleSkillsChange = (skill: string, checked: boolean) => {
    const newSkills = checked
      ? [...currentFilters.skills || [], skill]
      : (currentFilters.skills || []).filter(s => s !== skill);

    onFiltersChange({
      ...currentFilters,
      skills: newSkills,
    });
  };

  // Handle min projects change
  const handleMinProjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
    onFiltersChange({
      ...currentFilters,
      minProjects: value || undefined,
    });
  };

  // Handle min reputation change
  const handleMinReputationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
    onFiltersChange({
      ...currentFilters,
      minReputation: value || undefined,
    });
  };

  // Handle featured only toggle
  const handleFeaturedOnlyToggle = (checked: boolean) => {
    onFiltersChange({
      ...currentFilters,
      showFeaturedOnly: checked,
    });
  };

  // 专家领域区域滚轮处理函数
  const handleExpertiseWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target as HTMLElement;

    // 判断滚动方向和边界
    const reachedTop = scrollTop === 0 && e.deltaY < 0;
    const reachedBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;

    // 如果已经到达顶部或底部，则允许事件冒泡
    if (!reachedTop && !reachedBottom) {
      // 阻止事件冒泡以防止页面滚动
      e.stopPropagation();
    }
  };

  // 技能区域滚轮处理函数
  const handleSkillsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target as HTMLElement;

    // 判断滚动方向和边界
    const reachedTop = scrollTop === 0 && e.deltaY < 0;
    const reachedBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;

    // 如果已经到达顶部或底部，则允许事件冒泡
    if (!reachedTop && !reachedBottom) {
      // 阻止事件冒泡以防止页面滚动
      e.stopPropagation();
    }
  };

  // Handle sort field change
  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange({
      ...currentSort,
      field: e.target.value as any, // TS will validate at runtime
    });
  };

  // Handle sort direction change
  const handleSortDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange({
      ...currentSort,
      direction: e.target.value as 'asc' | 'desc',
    });
  };

  return (
    <div className="bg-white border border-brand-border rounded-none p-6 mb-8 animate-in slide-in-from-top-2">
      <h3 className="font-oswald font-light text-xl text-brand-text mb-6 flex items-center justify-between">
        <span>筛选开发者</span>
        <button
          onClick={toggleFilters}
          className="p-1 rounded hover:bg-brand-linen transition-colors"
          aria-label={filtersVisible ? "收起筛选" : "展开筛选"}
        >
          {filtersVisible ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Expertise Filter */}
        <div>
          <h4 className="font-roboto text-sm uppercase tracking-wider text-brand-light-gray mb-3">专业领域</h4>
          <div
            className="space-y-2 max-h-40 overflow-y-auto pr-2"
            onWheel={handleExpertiseWheel}
          >
            {availableExpertise.map((exp) => (
              <label key={exp} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={currentFilters.expertise?.includes(exp) || false}
                  onChange={(e) => handleExpertiseChange(exp, e.target.checked)}
                  className="h-4 w-4 text-brand-text border-brand-border rounded focus:ring-brand-text"
                />
                <span className="text-sm text-brand-dark-gray">{exp}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Skills Filter */}
        <div>
          <h4 className="font-roboto text-sm uppercase tracking-wider text-brand-light-gray mb-3">技能</h4>
          <div
            className="space-y-2 max-h-40 overflow-y-auto pr-2"
            onWheel={handleSkillsWheel}
          >
            {availableSkills.map((skill) => (
              <label key={skill} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={currentFilters.skills?.includes(skill) || false}
                  onChange={(e) => handleSkillsChange(skill, e.target.checked)}
                  className="h-4 w-4 text-brand-text border-brand-border rounded focus:ring-brand-text"
                />
                <span className="text-sm text-brand-dark-gray">{skill}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Numeric Filters and Featured Toggle */}
        <div>
          <h4 className="font-roboto text-sm uppercase tracking-wider text-brand-light-gray mb-3">其他筛选</h4>

          <div className="space-y-4">
            {/* Min Projects */}
            <div>
              <label className="block text-sm text-brand-dark-gray mb-1">最少项目数</label>
              <input
                type="number"
                value={currentFilters.minProjects || ''}
                onChange={handleMinProjectsChange}
                min="0"
                className="w-full bg-transparent border-b border-brand-border py-2 text-base font-roboto placeholder-brand-light-gray focus:outline-none focus:border-b-2"
                placeholder="0"
              />
            </div>

            {/* Min Reputation */}
            <div>
              <label className="block text-sm text-brand-dark-gray mb-1">最低声望</label>
              <input
                type="number"
                value={currentFilters.minReputation || ''}
                onChange={handleMinReputationChange}
                min="0"
                className="w-full bg-transparent border-b border-brand-border py-2 text-base font-roboto placeholder-brand-light-gray focus:outline-none focus:border-b-2"
                placeholder="0"
              />
            </div>

            {/* Featured Only */}
            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="featuredOnly"
                checked={currentFilters.showFeaturedOnly || false}
                onChange={(e) => handleFeaturedOnlyToggle(e.target.checked)}
                className="h-4 w-4 text-brand-text border-brand-border rounded focus:ring-brand-text"
              />
              <label htmlFor="featuredOnly" className="ml-2 text-sm text-brand-dark-gray">
                仅显示精选开发者
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mt-8 pt-6 border-t border-brand-border/30">
        <h4 className="font-roboto text-sm uppercase tracking-wider text-brand-light-gray mb-3">排序方式</h4>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-brand-dark-gray mb-1">按</label>
            <select
              value={currentSort.field}
              onChange={handleSortFieldChange}
              className="bg-transparent border-b border-brand-border py-2 text-base font-roboto focus:outline-none focus:border-b-2"
            >
              <option value="reputationScore">声望</option>
              <option value="projectsCount">项目数</option>
              <option value="contributions">贡献数</option>
              <option value="joinedDate">加入时间</option>
              <option value="lastActive">活跃度</option>
              <option value="displayName">姓名</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-dark-gray mb-1">方向</label>
            <select
              value={currentSort.direction}
              onChange={handleSortDirectionChange}
              className="bg-transparent border-b border-brand-border py-2 text-base font-roboto focus:outline-none focus:border-b-2"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reset Filters Button */}
      <div className="mt-6">
        <button
          onClick={() => {
            onFiltersChange({});
            onSortChange({ field: 'reputationScore', direction: 'desc' });
          }}
          className="
            px-4 py-2 bg-transparent text-brand-text
            font-roboto uppercase tracking-wider text-sm
            border-2 border-brand-border
            transition-all duration-300
            hover:bg-brand-text hover:text-brand-linen
          "
        >
          重置筛选
        </button>
      </div>
    </div>
  );
};

export default DeveloperFilters;