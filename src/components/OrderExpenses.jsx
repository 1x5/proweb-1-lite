import React, { useMemo, useCallback } from 'react';
import { Plus, Trash2, ExternalLink, Link } from 'lucide-react';
import { useInputHandlers } from '../hooks/useInputHandlers';

const ExpenseItem = React.memo(({ 
  expense, 
  editMode, 
  theme, 
  onUpdateExpense, 
  onRemoveExpense, 
  onPasteLink, 
  linkAnimations,
  handleContextMenu 
}) => {
  const handleNameChange = useCallback((e) => {
    onUpdateExpense(expense.id, { name: e.target.value });
  }, [expense.id, onUpdateExpense]);

  const handleCostChange = useCallback((e) => {
    onUpdateExpense(expense.id, { cost: parseFloat(e.target.value) || 0 });
  }, [expense.id, onUpdateExpense]);

  const handleRemove = useCallback(() => {
    onRemoveExpense(expense.id);
  }, [expense.id, onRemoveExpense]);

  const handlePaste = useCallback(() => {
    onPasteLink(expense.id);
  }, [expense.id, onPasteLink]);

  return (
    <div className="mb-2">
      <div className="flex justify-between items-end">
        <div className="flex items-center">
          {editMode ? (
            <div className="flex items-center">
              <input 
                type="text" 
                value={expense.name}
                onChange={handleNameChange}
                onContextMenu={handleContextMenu}
                className="p-1 rounded"
                style={{ 
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  border: 'none',
                  fontSize: '0.875rem',
                  width: '150px'
                }}
                placeholder="Название"
              />
              <button
                onClick={handlePaste}
                className="p-1.5 rounded-full ml-2 flex items-center justify-center"
                style={{ 
                  backgroundColor: theme.inputBg,
                  color: expense.link ? theme.accent : theme.textSecondary
                }}
                title={expense.link || 'Вставить ссылку из буфера'}
              >
                <Link
                  size={16}
                  className="cursor-pointer"
                  style={{ 
                    color: expense.link ? theme.accent : theme.textSecondary,
                    animation: linkAnimations[expense.id] ? 'linkSuccess 1s ease' : 'none'
                  }}
                />
              </button>
            </div>
          ) : (
            expense.name && (
              <div className="flex items-center">
                {expense.link ? (
                  <a
                    href={expense.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:opacity-80"
                    style={{ color: theme.textPrimary }}
                  >
                    <span style={{ fontSize: '0.875rem' }}>{expense.name}</span>
                    <ExternalLink size={14} style={{ color: theme.textSecondary, marginLeft: '8px' }} />
                  </a>
                ) : (
                  <span style={{ color: theme.textPrimary, fontSize: '0.875rem' }}>{expense.name}</span>
                )}
              </div>
            )
          )}
        </div>
        <div className="flex items-center">
          {editMode ? (
            <>
              <input 
                type="number" 
                value={expense.cost || ''}
                onChange={handleCostChange}
                onContextMenu={handleContextMenu}
                className="p-1 rounded w-20 text-right mr-2"
                style={{ 
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  border: 'none',
                  fontSize: '0.875rem'
                }}
                placeholder="0"
              />
              <button 
                onClick={handleRemove}
                className="p-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,0,0,0.1)' }}
              >
                <Trash2 size={14} color={theme.red} />
              </button>
            </>
          ) : (
            <span style={{ color: theme.textPrimary, fontSize: '0.875rem', backgroundColor: theme.card, paddingLeft: '4px' }}>
              {expense.cost}₽
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

const OrderExpenses = ({ 
  expenses, 
  editMode, 
  theme, 
  onAddExpense, 
  onUpdateExpense, 
  onRemoveExpense, 
  onPasteLink,
  linkAnimations 
}) => {
  const { handleContextMenu } = useInputHandlers();

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (parseFloat(exp.cost) || 0), 0);
  }, [expenses]);

  return (
    <>
      <div className="flex justify-between items-center mb-1.5">
        <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>
          Расходы: {totalExpenses}₽
        </h2>
        {editMode && (
          <button 
            className="rounded-full w-6 h-6 flex items-center justify-center"
            style={{ backgroundColor: theme.accent }}
            onClick={onAddExpense}
          >
            <Plus size={16} color="#ffffff" />
          </button>
        )}
      </div>

      <div className="h-px w-full mb-1.5" style={{ backgroundColor: theme.cardBorder }}></div>
      
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          editMode={editMode}
          theme={theme}
          onUpdateExpense={onUpdateExpense}
          onRemoveExpense={onRemoveExpense}
          onPasteLink={onPasteLink}
          linkAnimations={linkAnimations}
          handleContextMenu={handleContextMenu}
        />
      ))}
    </>
  );
};

export default React.memo(OrderExpenses); 