export const STAGE_LABEL = {
  requested: 'Created', submitted: 'Submitted', accepted: 'Accepted', sorting: 'Sorting',
  washing: 'Washing', drying: 'Drying', ironing: 'Ironing', quality_check: 'Quality Check',
  ready_for_collection: 'Ready', delivered: 'Delivered',
};

export const STAGE_TIMELINE_LABEL = {
  requested: 'Order Created', submitted: 'Bag Submitted', accepted: 'Accepted', sorting: 'Sorted',
  washing: 'Washed', drying: 'Dried', ironing: 'Ironed', quality_check: 'Quality Checked',
  ready_for_collection: 'Ready for Collection', delivered: 'Delivered',
};

export const STAGE_COLOR = {
  requested: '#94a3b8', submitted: '#64748b', accepted: '#2563eb', sorting: '#7c3aed',
  washing: '#0891b2', drying: '#0d9488', ironing: '#d97706', quality_check: '#ca8a04',
  ready_for_collection: '#16a34a', delivered: '#15803d',
};

export const EXCEPTION_LABEL = {
  on_hold: 'On Hold', damaged: 'Damaged', reported_missing: 'Reported Missing', investigation: 'Investigation',
};

export const EXCEPTION_STATES = ['on_hold', 'damaged', 'reported_missing', 'investigation'];

export const STAGES = Object.keys(STAGE_LABEL);

export const fmt = (s) => (s ? new Date(s).toLocaleString() : '—');
