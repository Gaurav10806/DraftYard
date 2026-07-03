// client/src/pages/RevivalBoard.jsx
import { useEffect, useState } from 'react';
import { getRevivalProjects, raiseHand } from '../services/revivalApi';
import './RevivalBoard.css';

const STAGE_OPTIONS = ['Idea only', 'Prototype', '50% done', 'Almost complete', 'Launched but abandoned'];
const DOMAIN_OPTIONS = ['web', 'mobile', 'ml', 'game', 'hardware', 'other'];

export default function RevivalBoard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ stack: '', stage: '', domain: '' });
  const [activeProject, setActiveProject] = useState(null); // project selected for the raise-hand modal

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stage, filters.domain]);

  async function fetchProjects() {
    setLoading(true);
    setError('');
    try {
      const data = await getRevivalProjects(filters);
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleStackSubmit(e) {
    e.preventDefault();
    fetchProjects();
  }

  async function handleRaiseHand(projectId, formData) {
    try {
      const updated = await raiseHand(projectId, formData);
      setProjects((prev) => prev.map((p) => (p._id === projectId ? updated : p)));
      setActiveProject(null);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="revival-board">
      <header className="rb-header">
        <h1>Revival Board</h1>
        <p>Dead projects looking for someone to bring them back to life.</p>
      </header>

      <form className="rb-filters" onSubmit={handleStackSubmit}>
        <input
          type="text"
          placeholder="Filter by tech (e.g. React)"
          value={filters.stack}
          onChange={(e) => setFilters({ ...filters, stack: e.target.value })}
        />

        <select
          value={filters.stage}
          onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
        >
          <option value="">Any stage died</option>
          {STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.domain}
          onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
        >
          <option value="">Any domain</option>
          {DOMAIN_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <button type="submit">Apply</button>
      </form>

      {loading && <p className="rb-status">Loading projects…</p>}
      {error && <p className="rb-status rb-error">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="rb-status">No projects open for revival match those filters.</p>
      )}

      <div className="rb-grid">
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onRaiseHand={() => setActiveProject(project)}
          />
        ))}
      </div>

      {activeProject && (
        <RaiseHandModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onSubmit={(formData) => handleRaiseHand(activeProject._id, formData)}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onRaiseHand }) {
  const handCount = project.raisedHands?.length || 0;

  return (
    <div className="rb-card">
      <div className="rb-card-top">
        <h3>{project.projectName}</h3>
        <span className="rb-badge">{project.domain}</span>
      </div>
      <p className="rb-oneliner">{project.oneLiner}</p>

      <div className="rb-tags">
        {project.techStack?.map((tech) => (
          <span key={tech} className="rb-tag">{tech}</span>
        ))}
      </div>

      <p className="rb-why"><strong>Why it died:</strong> {project.whyItDied}</p>
      {project.salvageable && (
        <p className="rb-salvage"><strong>Salvageable:</strong> {project.salvageable}</p>
      )}

      <div className="rb-card-footer">
        <span className="rb-stage">{project.stageDied}</span>
        <button className="rb-raise-btn" onClick={onRaiseHand}>
          🙋 Raise Hand {handCount > 0 && `(${handCount})`}
        </button>
      </div>
    </div>
  );
}

function RaiseHandModal({ project, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit({ name, message, contact });
    setSubmitting(false);
  }

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Revive "{project.projectName}"</h3>
        <p className="rb-modal-sub">Let the original team know you're interested.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Contact (email / discord / GitHub — optional)
            <input value={contact} onChange={(e) => setContact(e.target.value)} />
          </label>

          <label>
            Message (optional)
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Why are you interested in reviving this?"
            />
          </label>

          <div className="rb-modal-actions">
            <button type="button" onClick={onClose} className="rb-cancel-btn">Cancel</button>
            <button type="submit" disabled={submitting} className="rb-submit-btn">
              {submitting ? 'Submitting…' : 'Raise Hand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}