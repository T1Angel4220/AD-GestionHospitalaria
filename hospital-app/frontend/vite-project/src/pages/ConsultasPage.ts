import type { Consulta, ConsultaCreate, ConsultaUpdate } from '../types/consultas';
import { ConsultasApi } from '../api/consultasApi';

export class ConsultasPage {
  private container: HTMLElement;
  private consultas: Consulta[] = [];
  private isEditing: boolean = false;
  private editingId: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadConsultas();
    this.render();
  }

  private async loadConsultas(): Promise<void> {
    try {
      this.consultas = await ConsultasApi.getConsultas();
    } catch (error) {
      console.error('Error al cargar consultas:', error);
      this.showError('Error al cargar las consultas');
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="consultas-container">
        <header class="consultas-header">
          <h1>Gestión de Consultas Médicas</h1>
          <button id="add-consulta-btn" class="btn btn-primary">
            Nueva Consulta
          </button>
        </header>

        <div class="consultas-content">
          <div id="consultas-table-container" class="table-container">
            ${this.renderConsultasTable()}
          </div>

          <div id="consulta-form-container" class="form-container hidden">
            ${this.renderConsultaForm()}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderConsultasTable(): string {
    if (this.consultas.length === 0) {
      return `
        <div class="empty-state">
          <p>No hay consultas registradas</p>
        </div>
      `;
    }

    return `
      <table class="consultas-table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Fecha</th>
            <th>Motivo</th>
            <th>Diagnóstico</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${this.consultas.map(consulta => this.renderConsultaRow(consulta)).join('')}
        </tbody>
      </table>
    `;
  }

  private renderConsultaRow(consulta: Consulta): string {
    const fecha = new Date(consulta.fecha).toLocaleDateString('es-ES');
    return `
      <tr>
        <td>${consulta.paciente_nombre} ${consulta.paciente_apellido}</td>
        <td>${fecha}</td>
        <td>${consulta.motivo || '-'}</td>
        <td>${consulta.diagnostico || '-'}</td>
        <td class="actions">
          <button class="btn btn-sm btn-secondary" onclick="consultasPage.editConsulta(${consulta.id})">
            Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="consultasPage.deleteConsulta(${consulta.id})">
            Eliminar
          </button>
        </td>
      </tr>
    `;
  }

  private renderConsultaForm(): string {
    const consulta = this.isEditing && this.editingId 
      ? this.consultas.find(c => c.id === this.editingId)
      : null;

    return `
      <div class="form-card">
        <h2>${this.isEditing ? 'Editar Consulta' : 'Nueva Consulta'}</h2>
        <form id="consulta-form">
          <div class="form-group">
            <label for="paciente_nombre">Nombre del Paciente:</label>
            <input 
              type="text" 
              id="paciente_nombre" 
              name="paciente_nombre" 
              value="${consulta?.paciente_nombre || ''}"
              required
            >
          </div>

          <div class="form-group">
            <label for="paciente_apellido">Apellido del Paciente:</label>
            <input 
              type="text" 
              id="paciente_apellido" 
              name="paciente_apellido" 
              value="${consulta?.paciente_apellido || ''}"
              required
            >
          </div>

          <div class="form-group">
            <label for="fecha">Fecha y Hora:</label>
            <input 
              type="datetime-local" 
              id="fecha" 
              name="fecha" 
              value="${consulta ? new Date(consulta.fecha).toISOString().slice(0, 16) : ''}"
              required
            >
          </div>

          <div class="form-group">
            <label for="motivo">Motivo de la Consulta:</label>
            <textarea 
              id="motivo" 
              name="motivo" 
              rows="3"
            >${consulta?.motivo || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="diagnostico">Diagnóstico:</label>
            <textarea 
              id="diagnostico" 
              name="diagnostico" 
              rows="3"
            >${consulta?.diagnostico || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="tratamiento">Tratamiento:</label>
            <textarea 
              id="tratamiento" 
              name="tratamiento" 
              rows="3"
            >${consulta?.tratamiento || ''}</textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              ${this.isEditing ? 'Actualizar' : 'Crear'} Consulta
            </button>
            <button type="button" id="cancel-form-btn" class="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Botón para mostrar formulario
    const addBtn = document.getElementById('add-consulta-btn');
    addBtn?.addEventListener('click', () => this.showForm());

    // Botón para cancelar formulario
    const cancelBtn = document.getElementById('cancel-form-btn');
    cancelBtn?.addEventListener('click', () => this.hideForm());

    // Formulario
    const form = document.getElementById('consulta-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  private showForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.toggleFormVisibility(true);
  }

  private hideForm(): void {
    this.toggleFormVisibility(false);
  }

  private toggleFormVisibility(show: boolean): void {
    const tableContainer = document.getElementById('consultas-table-container');
    const formContainer = document.getElementById('consulta-form-container');
    
    if (show) {
      tableContainer?.classList.add('hidden');
      formContainer?.classList.remove('hidden');
      formContainer!.innerHTML = this.renderConsultaForm();
      this.attachFormEventListeners();
    } else {
      tableContainer?.classList.remove('hidden');
      formContainer?.classList.add('hidden');
    }
  }

  private attachFormEventListeners(): void {
    const cancelBtn = document.getElementById('cancel-form-btn');
    cancelBtn?.addEventListener('click', () => this.hideForm());

    const form = document.getElementById('consulta-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  private async handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const consultaData: ConsultaCreate | ConsultaUpdate = {
      paciente_nombre: formData.get('paciente_nombre') as string,
      paciente_apellido: formData.get('paciente_apellido') as string,
      fecha: formData.get('fecha') as string,
      motivo: formData.get('motivo') as string || undefined,
      diagnostico: formData.get('diagnostico') as string || undefined,
      tratamiento: formData.get('tratamiento') as string || undefined,
    };

    try {
      if (this.isEditing && this.editingId) {
        await ConsultasApi.updateConsulta(this.editingId, consultaData as ConsultaUpdate);
        this.showSuccess('Consulta actualizada correctamente');
      } else {
        // Para crear, necesitamos agregar id_centro e id_medico
        // Por ahora usaremos valores por defecto, en una app real estos vendrían del contexto del usuario
        const createData: ConsultaCreate = {
          ...consultaData as ConsultaCreate,
          id_centro: 1, // Esto debería venir del contexto del usuario logueado
          id_medico: 1, // Esto debería venir del contexto del usuario logueado
        };
        await ConsultasApi.createConsulta(createData);
        this.showSuccess('Consulta creada correctamente');
      }
      
      await this.loadConsultas();
      this.hideForm();
      this.render();
    } catch (error) {
      console.error('Error al guardar consulta:', error);
      this.showError('Error al guardar la consulta');
    }
  }

  public async editConsulta(id: number): Promise<void> {
    this.isEditing = true;
    this.editingId = id;
    this.toggleFormVisibility(true);
  }

  public async deleteConsulta(id: number): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar esta consulta?')) {
      try {
        await ConsultasApi.deleteConsulta(id);
        this.showSuccess('Consulta eliminada correctamente');
        await this.loadConsultas();
        this.render();
      } catch (error) {
        console.error('Error al eliminar consulta:', error);
        this.showError('Error al eliminar la consulta');
      }
    }
  }

  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Hacer la instancia global para los event listeners
declare global {
  var consultasPage: ConsultasPage;
}
