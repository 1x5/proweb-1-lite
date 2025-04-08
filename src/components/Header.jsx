import React from 'react';
import { ChevronLeft, Sun, Moon, Edit2, Save, Trash2, Search, List, LayoutGrid, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({
  title,
  showBackButton = false,
  showThemeToggle = true,
  showEditButton = false,
  showDeleteButton = false,
  showSearch = false,
  showFilter = false,
  showViewToggle = false,
  editMode = false,
  compactMode = false,
  onBack,
  onEdit,
  onDelete,
  onThemeToggle,
  onSearch,
  onFilter,
  onViewToggle
}) => {
  const { darkMode, theme } = useTheme();

  return (
    <div className="flex-none p-3 flex justify-between items-center" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center">
        {showBackButton && (
          <ChevronLeft 
            size={24} 
            color={theme.textPrimary} 
            className="mr-2 cursor-pointer" 
            onClick={onBack}
          />
        )}
        <h1 className="text-lg font-bold" style={{ color: theme.textPrimary }}>
          {title}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {showSearch && (
          <button
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.card }}
            onClick={onSearch}
          >
            <Search size={20} style={{ color: theme.textSecondary }} />
          </button>
        )}

        {showFilter && (
          <button
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.card }}
            onClick={onFilter}
          >
            <Filter size={20} style={{ color: theme.textSecondary }} />
          </button>
        )}

        {showViewToggle && (
          <button
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.card }}
            onClick={onViewToggle}
          >
            {compactMode ? (
              <LayoutGrid size={20} style={{ color: theme.textSecondary }} />
            ) : (
              <List size={20} style={{ color: theme.textSecondary }} />
            )}
          </button>
        )}

        {showThemeToggle && (
          <button
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.card }}
            onClick={onThemeToggle}
          >
            {darkMode ? (
              <Sun size={20} style={{ color: theme.textSecondary }} />
            ) : (
              <Moon size={20} style={{ color: theme.textSecondary }} />
            )}
          </button>
        )}

        {showDeleteButton && (
          <button 
            className="rounded-full p-2"
            style={{ backgroundColor: theme.red }}
            onClick={onDelete}
          >
            <Trash2 size={20} color="#ffffff" />
          </button>
        )}

        {showEditButton && (
          <button 
            className="rounded-full p-2"
            style={{ backgroundColor: theme.card }}
            onClick={onEdit}
          >
            {editMode ? (
              <Save size={20} style={{ color: theme.textSecondary }} />
            ) : (
              <Edit2 size={20} style={{ color: theme.textSecondary }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Header; 