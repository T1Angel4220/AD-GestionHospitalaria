import React, { useState, useEffect } from 'react';
import type { Consulta, ConsultaCreate, ConsultaUpdate } from '../types/consultas';
import { ConsultasApi } from '../api/consultasApi';
import './ConsultasPage.css';

const ConsultasPage: React.FC = () => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_showForm, setShowForm] = useState(false);
  const [_editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      setLoading(true);
      const data = await ConsultasApi.getConsultas();
      setConsultas(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar consultas:', err);
      setError('Error al cargar las consultas');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para modales (se implementarán en siguientes pasos)
  // const _handleCreateConsulta = async (consultaData: ConsultaCreate) => {
  //   try {
  //     await ConsultasApi.createConsulta(consultaData);
  //     await loadConsultas();
  //     setShowForm(false);
  //     showNotification('Consulta creada correctamente', 'success');
  //   } catch (err) {
  //     console.error('Error al crear consulta:', err);
  //     showNotification('Error al crear la consulta', 'error');
  //   }
  // };

  // const _handleUpdateConsulta = async (id: number, consultaData: ConsultaUpdate) => {
  //   try {
  //     await ConsultasApi.updateConsulta(id, consultaData);
  //     await loadConsultas();
  //     setEditingConsulta(null);
  //     showNotification('Consulta actualizada correctamente', 'success');
  //   } catch (err) {
  //     console.error('Error al actualizar consulta:', err);
  //     showNotification('Error al actualizar la consulta', 'error');
  //   }
  // };

  const handleDeleteConsulta = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta consulta?')) {
      try {
        await ConsultasApi.deleteConsulta(id);
        await loadConsultas();
        showNotification('Consulta eliminada correctamente', 'success');
      } catch (err) {
        console.error('Error al eliminar consulta:', err);
        showNotification('Error al eliminar la consulta', 'error');
      }
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Implementar notificaciones toast
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const filteredConsultas = consultas.filter(consulta =>
    consulta.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consulta.paciente_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consulta.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consulta.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConsultaStatus = (consulta: Consulta): { text: string; color: string } => {
    // Lógica simple para determinar el estado basado en la fecha
    const consultaDate = new Date(consulta.fecha);
    const now = new Date();
    
    if (consulta.diagnostico && consulta.tratamiento) {
      return { text: 'Completada', color: 'completed' };
    } else if (consultaDate > now) {
      return { text: 'Programada', color: 'scheduled' };
    } else {
      return { text: 'En Proceso', color: 'in-progress' };
    }
  };

  if (loading) {
    return (
      <div className="consultas-container">
        <div className="loading">Cargando consultas...</div>
      </div>
    );
  }

  return (
    <div className="consultas-container">
      {/* Header */}
      <header className="consultas-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <div className="logo-icon">🏥</div>
              <div className="logo-text">
                <h1>API de Consultas Médicas</h1>
                <p>Gestión independiente por hospital</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button 
              className="btn btn-primary btn-new"
              onClick={() => setShowForm(true)}
            >
              <span className="btn-icon">+</span>
              Nueva Consulta
            </button>
          </div>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{consultas.length}</div>
            <div className="stat-label">Total Consultas</div>
            <div className="stat-subtitle">Registros en el sistema</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">
              {consultas.filter(c => getConsultaStatus(c).text === 'Completada').length}
            </div>
            <div className="stat-label">Completadas</div>
            <div className="stat-subtitle">Consultas finalizadas</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">
              {consultas.filter(c => getConsultaStatus(c).text === 'Programada').length}
            </div>
            <div className="stat-label">Programadas</div>
            <div className="stat-subtitle">Próximas citas</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">0</div>
            <div className="stat-label">Canceladas</div>
            <div className="stat-subtitle">Consultas canceladas</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-container">
        <h3>Filtros y Búsqueda</h3>
        <div className="filters-row">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por paciente, médico, especialidad o hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-dropdown">
            <span className="filter-icon">🔽</span>
            <select className="filter-select">
              <option>Todos los estados</option>
              <option>Completadas</option>
              <option>Programadas</option>
              <option>En Proceso</option>
            </select>
          </div>
          <div className="filter-dropdown">
            <select className="filter-select">
              <option>Todas las especialidades</option>
              <option>Cardiología</option>
              <option>Neurología</option>
              <option>Pediatría</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consultas List */}
      <div className="consultas-list">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {filteredConsultas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No hay consultas registradas</h3>
            <p>Comienza creando tu primera consulta médica</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Crear Primera Consulta
            </button>
          </div>
        ) : (
          filteredConsultas.map(consulta => {
            const status = getConsultaStatus(consulta);
            return (
              <div key={consulta.id} className="consulta-card">
                <div className="consulta-header">
                  <div className="patient-info">
                    <div className="patient-icon">👤</div>
                    <div className="patient-details">
                      <h3>{consulta.paciente_nombre} {consulta.paciente_apellido}</h3>
                      <p>ID: {consulta.id}</p>
                    </div>
                  </div>
                  <div className="consulta-actions">
                    <span className={`status-badge ${status.color}`}>
                      {status.text}
                    </span>
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => setEditingConsulta(consulta)}
                      title="Editar consulta"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteConsulta(consulta.id)}
                      title="Eliminar consulta"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="consulta-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">👨‍⚕️</span>
                      <span>Médico: Dr. {consulta.id_medico}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🏥</span>
                      <span>Centro: Hospital {consulta.id_centro}</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>Fecha: {new Date(consulta.fecha).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🕐</span>
                      <span>Hora: {new Date(consulta.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">💓</span>
                      <span>Especialidad: Medicina General</span>
                    </div>
                  </div>
                </div>
                
                {consulta.motivo && (
                  <div className="consulta-section">
                    <h4>Motivo de la consulta:</h4>
                    <p>{consulta.motivo}</p>
                  </div>
                )}
                
                {consulta.diagnostico && (
                  <div className="consulta-section diagnosis">
                    <h4>Diagnóstico:</h4>
                    <p>{consulta.diagnostico}</p>
                  </div>
                )}
                
                {consulta.tratamiento && (
                  <div className="consulta-section treatment">
                    <h4>Tratamiento:</h4>
                    <p>{consulta.tratamiento}</p>
                  </div>
                )}
                
                <div className="consulta-footer">
                  <small>
                    Creado: {new Date(consulta.created_at).toLocaleString('es-ES')}
                  </small>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals will be added in next steps */}
    </div>
  );
};

export default ConsultasPage;
