import { useCallback } from 'react';

export const useQuickAdd = () => {
  const parseInput = useCallback((input) => {
    const result = {
      title: input,
      description: '',
      dueDate: '',
      priority: 'medium',
      category: '',
      estimatedMinutes: null
    };

    const datePatterns = [
      { regex: /今天/, days: 0 },
      { regex: /明天/, days: 1 },
      { regex: /后天/, days: 2 }
    ];

    for (const pattern of datePatterns) {
      const match = input.match(pattern.regex);
      if (match) {
        if (pattern.days !== undefined) {
          const date = new Date();
          date.setDate(date.getDate() + pattern.days);
          result.dueDate = date.toISOString().split('T')[0];
        }
        result.title = result.title.replace(match[0], '').trim();
        break;
      }
    }

    if (/高优先级|urgent|紧急/.test(input)) {
      result.priority = 'high';
      result.title = result.title.replace(/高优先级|urgent|紧急/g, '').trim();
    } else if (/低优先级|low/.test(input)) {
      result.priority = 'low';
      result.title = result.title.replace(/低优先级|low/g, '').trim();
    }

    const categoryMatch = input.match(/#(\S+)/);
    if (categoryMatch) {
      result.category = categoryMatch[1];
      result.title = result.title.replace(categoryMatch[0], '').trim();
    }

    const timeMatch = input.match(/(\d+)\s*(分钟|小时|h|min)/);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      if (timeMatch[2] === '小时' || timeMatch[2] === 'h') {
        result.estimatedMinutes = value * 60;
      } else {
        result.estimatedMinutes = value;
      }
      result.title = result.title.replace(timeMatch[0], '').trim();
    }

    result.title = result.title.replace(/\s+/g, ' ').trim();

    return result;
  }, []);

  return { parseInput };
};
