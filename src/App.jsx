import { useMemo, useState } from 'react';

const ASSET = '/assets/';

const initialTasks = [
  { id: 1, title: 'Torment Mark Grayson', priority: 'high', group: 'today' },
  {
    id: 2,
    title: 'Do some workouts',
    priority: 'medium',
    group: 'today',
    expanded: true,
    subtasks: [
      { id: '2a', title: 'Bench the moon', done: false },
      { id: '2b', title: 'Get to the deepest point of the pacific', done: false },
      { id: '2c', title: 'Chew gum (For speeches)', done: false },
    ],
  },
  { id: 3, title: 'Fly round the galaxy', priority: 'low', group: 'today' },
  { id: 4, title: 'Work on my speech', priority: 'low', group: 'today' },
  { id: 5, title: 'Check if my viltrumites are blending in', group: 'today', done: true },
  { id: 6, title: 'Torment Mark Grayson again', priority: 'high', group: 'today' },
  { id: 7, title: 'Inspect the Coalition outpost', priority: 'high', group: 'scheduled' },
  { id: 8, title: 'Review the Viltrumite census', priority: 'medium', group: 'scheduled' },
  { id: 9, title: 'Train the next generation', priority: 'low', group: 'scheduled' },
  { id: 10, title: 'Chart the Andromeda route', priority: 'medium', group: 'scheduled' },
  { id: 11, title: 'Meet the empire council', priority: 'high', group: 'scheduled' },
  { id: 12, title: 'Repair the command cruiser', priority: 'high', group: 'overdue' },
  { id: 13, title: 'Send the conquest report', priority: 'medium', group: 'overdue' },
  { id: 14, title: 'Call General Kregg', priority: 'low', group: 'overdue' },
];

const filters = [
  { id: 'today', label: 'Today', color: '#b3c3fd', icon: 'today.svg' },
  { id: 'scheduled', label: 'Scheduled', color: '#fbf27e', icon: 'scheduled.svg' },
  { id: 'all', label: 'All', color: '#cff3ea', icon: 'all.svg' },
  { id: 'overdue', label: 'Overdue', color: '#fcbef3', icon: 'overdue.svg' },
  { id: 'completed', label: 'Completed', color: '#d6edcf', icon: 'completed.svg' },
];

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeFilter, setActiveFilter] = useState('today');
  const [query, setQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draftSubtasks, setDraftSubtasks] = useState(['']);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [allExpandedIds, setAllExpandedIds] = useState(() => new Set());

  const counts = useMemo(() => ({
    today: tasks.filter((task) => task.group === 'today' && !task.done).length,
    scheduled: tasks.filter((task) => task.group === 'scheduled' && !task.done).length,
    overdue: tasks.filter((task) => task.group === 'overdue' && !task.done).length,
    all: tasks.filter((task) => !task.done).length,
    completed: tasks.filter((task) => task.done).length,
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const inFilter = activeFilter === 'completed'
      ? task.done
      : !task.done && (activeFilter === 'all' || task.group === activeFilter);
    const searchText = [task.title, ...(task.subtasks?.map((item) => item.title) ?? [])].join(' ').toLowerCase();
    return inFilter && searchText.includes(query.trim().toLowerCase());
  }), [activeFilter, query, tasks]);

  const toggleTask = (id) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  };

  const toggleExpanded = (id) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, expanded: !task.expanded } : task));
  };

  const toggleAllExpanded = (id) => {
    setAllExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task;

      const subtasks = task.subtasks.map((subtask) => (
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
      ));

      return {
        ...task,
        subtasks,
        done: subtasks.every((subtask) => subtask.done),
      };
    }));
  };

  const openAddModal = () => {
    setDraftSubtasks(['']);
    setIsAdding(true);
  };

  const updateDraftSubtask = (index, value) => {
    setDraftSubtasks((current) => current.map((subtask, subtaskIndex) => subtaskIndex === index ? value : subtask));
  };

  const addDraftSubtask = () => {
    setDraftSubtasks((current) => [...current, '']);
  };

  const removeDraftSubtask = (index) => {
    setDraftSubtasks((current) => current.length === 1
      ? ['']
      : current.filter((_, subtaskIndex) => subtaskIndex !== index));
  };

  const addTask = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    const createdAt = Date.now();
    const subtasks = draftSubtasks
      .map((subtask) => subtask.trim())
      .filter(Boolean)
      .map((subtask, index) => ({ id: `${createdAt}-${index}`, title: subtask, done: false }));
    setTasks((current) => [...current, {
      id: createdAt,
      title,
      priority: form.get('priority'),
      group: form.get('group'),
      expanded: subtasks.length > 0,
      ...(subtasks.length > 0 ? { subtasks } : {}),
    }]);
    setIsAdding(false);
    setActiveFilter(String(form.get('group')));
  };

  const activeMeta = filters.find((filter) => filter.id === activeFilter);
  const allSectionMeta = filters.filter((filter) => ['today', 'scheduled', 'overdue'].includes(filter.id));
  const queryText = query.trim().toLowerCase();
  const matchesSearch = (task) => [task.title, ...(task.subtasks?.map((item) => item.title) ?? [])]
    .join(' ')
    .toLowerCase()
    .includes(queryText);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#dashboard" aria-label="Viltrum-do home">
          <img src={`${ASSET}logo.svg`} alt="" />
          <span>Viltrum-do</span>
        </a>

        <label className="search-box">
          <img src={`${ASSET}search.svg`} alt="" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search tasks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="account-actions">
          <div className="notification-wrap">
            <button className="icon-button" type="button" aria-label="Notifications" onClick={() => setNotificationsOpen((value) => !value)}>
              <img src={`${ASSET}notifications.svg`} alt="" />
            </button>
            {notificationsOpen && (
              <div className="notification-popover" role="status">
                <strong>You’re all caught up</strong>
                <span>No new empire updates.</span>
              </div>
            )}
          </div>
          <button className="avatar" type="button" aria-label="Open profile">
            <img src={`${ASSET}avatar.png`} alt="Grand regent Thragg" />
          </button>
        </div>
      </header>

      <section className="dashboard" id="dashboard">
        <div className="overview">
          <div className="welcome-row">
            <div>
              <h1>Hello Grand regent Thragg,</h1>
              <p>There is work to be done</p>
            </div>
            <button className="add-button" type="button" onClick={openAddModal}>
              <img src={`${ASSET}plus.svg`} alt="" />
              <span>Add item</span>
            </button>
          </div>

          <div className="stat-grid" aria-label="Task filters">
            {filters.map((filter) => (
              <button
                className={`stat-outer ${filter.id}${activeFilter === filter.id ? ' active' : ''}`}
                key={filter.id}
                type="button"
                aria-pressed={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                <span className="stat-card" style={{ backgroundColor: filter.color }}>
                  <span className="stat-icon"><img src={`${ASSET}${filter.icon}`} alt="" /></span>
                  <span className="stat-copy">
                    <span>{filter.label}</span>
                    <strong>{counts[filter.id]}</strong>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`task-sections${activeFilter === 'all' ? ' grouped' : ''}`}>
          {(activeFilter === 'all' ? allSectionMeta : [activeMeta]).map((sectionMeta) => {
            const sectionTasks = activeFilter === 'all'
              ? tasks.filter((task) => !task.done && task.group === sectionMeta.id && matchesSearch(task))
              : visibleTasks;
            const isGrouped = activeFilter === 'all';

            return (
              <section className={`task-section${isGrouped ? ' compact' : ''}`} aria-labelledby={`task-section-${sectionMeta.id}`} key={sectionMeta.id}>
                <div className="section-label" style={{ backgroundColor: `${sectionMeta.color}1a` }}>
                  <span className="color-dot" style={{ backgroundColor: sectionMeta.color }} />
                  <h2 id={`task-section-${sectionMeta.id}`}>{sectionMeta.label}</h2>
                  <span className="count-badge">{counts[sectionMeta.id]}</span>
                </div>

                <div className="task-well">
                  <TaskRows
                    items={sectionTasks}
                    expandedIds={isGrouped ? allExpandedIds : null}
                    onToggleTask={toggleTask}
                    onToggleExpanded={isGrouped ? toggleAllExpanded : toggleExpanded}
                    onToggleSubtask={toggleSubtask}
                  />
                  {sectionTasks.length === 0 && (
                    <div className="empty-state">No {sectionMeta.label.toLowerCase()} tasks match “{query}”.</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {isAdding && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsAdding(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title">
            <div className="modal-heading">
              <div>
                <h2 id="add-title">Add a new item</h2>
                <p>Give the empire one less thing to worry about.</p>
              </div>
              <button type="button" aria-label="Close dialog" onClick={() => setIsAdding(false)}>×</button>
            </div>
            <form onSubmit={addTask}>
              <label>
                Task name
                <input name="title" autoFocus placeholder="What needs to be done?" required />
              </label>
              <fieldset className="subtask-builder">
                <legend>
                  <span>Smaller tasks</span>
                  <small>Optional</small>
                </legend>
                <div className="subtask-fields">
                  {draftSubtasks.map((subtask, index) => (
                    <div className="subtask-field" key={index}>
                      <span className="subtask-number">{index + 1}</span>
                      <input
                        aria-label={`Smaller task ${index + 1}`}
                        placeholder={index === 0 ? 'Add a smaller task' : 'Another smaller task'}
                        value={subtask}
                        onChange={(event) => updateDraftSubtask(index, event.target.value)}
                      />
                      <button type="button" aria-label={`Remove smaller task ${index + 1}`} onClick={() => removeDraftSubtask(index)}>×</button>
                    </div>
                  ))}
                </div>
                <button className="add-subtask-button" type="button" onClick={addDraftSubtask}>
                  <span>+</span> Add another smaller task
                </button>
              </fieldset>
              <div className="form-row">
                <label>
                  Schedule
                  <select name="group" defaultValue={activeFilter === 'all' ? 'today' : activeFilter}>
                    <option value="today">Today</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </label>
                <label>
                  Priority
                  <select name="priority" defaultValue="medium">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button className="secondary" type="button" onClick={() => setIsAdding(false)}>Cancel</button>
                <button className="add-button" type="submit">Add item</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function TaskRows({ items, expandedIds, onToggleTask, onToggleExpanded, onToggleSubtask }) {
  return (
    <div className="task-list">
      {items.map((task) => {
        const isExpanded = expandedIds ? expandedIds.has(task.id) : task.expanded;

        return (
          <article className={`task-card${task.done ? ' completed' : ''}`} key={task.id}>
            <div className="task-main-row">
              <button
                className={`chevron${isExpanded ? ' expanded' : ''}`}
                type="button"
                aria-label={isExpanded ? `Collapse ${task.title}` : `Expand ${task.title}`}
                onClick={() => onToggleExpanded(task.id)}
              >
                <img src={`${ASSET}chevron.svg`} alt="" />
              </button>
              <button
                className={`completion${task.done ? ' checked' : ''}`}
                type="button"
                aria-label={task.done ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
                aria-pressed={Boolean(task.done)}
                onClick={() => onToggleTask(task.id)}
              >
                {task.done && <img src={`${ASSET}check.svg`} alt="" />}
              </button>
              <div className="task-copy">
                <span className="task-title">{task.title}</span>
                {task.priority && <span className={`priority ${task.priority}`}>{task.priority[0].toUpperCase() + task.priority.slice(1)} priority</span>}
              </div>
            </div>

            {isExpanded && task.subtasks?.length > 0 && (
              <div className="subtask-list">
                {task.subtasks.map((subtask) => (
                  <label className={subtask.done ? 'done' : ''} key={subtask.id}>
                    <input type="checkbox" checked={subtask.done} onChange={() => onToggleSubtask(task.id, subtask.id)} />
                    <span className="subtask-control" />
                    <span>{subtask.title}</span>
                  </label>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default App;
