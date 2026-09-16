import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import {
  Palette,
  Monitor,
  Moon,
  Sun,
  PanelLeft,
  RotateCcw,
  Save,
  Check
} from 'lucide-react'

const DEFAULT_CONFIG = {
  nombreSistema: 'Control Comidas',
  iniciales: 'CC',
  colorPrincipal: '#f59e0b',
  colorSidebar: '#111827',
  tema: 'claro',
  sidebarCompacto: false
}

export default function Sistema() {

  const [config, setConfig] = useState(() => {
    try {
      const guardado = localStorage.getItem('control-comidas-config')

      return guardado
        ? { ...DEFAULT_CONFIG, ...JSON.parse(guardado) }
        : DEFAULT_CONFIG
    } catch {
      return DEFAULT_CONFIG
    }
  })

  const [mensaje, setMensaje] = useState('')

  const aplicarConfig = (datos) => {
    const root = document.documentElement

    root.style.setProperty('--app-primary', datos.colorPrincipal)
    root.style.setProperty('--app-sidebar', datos.colorSidebar)

    document.body.classList.toggle(
      'dark-mode',
      datos.tema === 'oscuro'
    )

    document.body.classList.toggle(
      'sidebar-compact',
      datos.sidebarCompacto
    )

    window.dispatchEvent(
      new CustomEvent('app-config-changed', {
        detail: datos
      })
    )
  }

  useEffect(() => {
    aplicarConfig(config)
  }, [config])

  const cambiar = (campo, valor) => {
    setConfig(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const guardar = () => {
    localStorage.setItem(
      'control-comidas-config',
      JSON.stringify(config)
    )

    aplicarConfig(config)

    setMensaje('Configuración guardada correctamente.')

    setTimeout(() => {
      setMensaje('')
    }, 3000)
  }

  const restaurar = () => {
    setConfig(DEFAULT_CONFIG)

    localStorage.removeItem('control-comidas-config')

    aplicarConfig(DEFAULT_CONFIG)

    setMensaje('Diseño original restaurado.')

    setTimeout(() => {
      setMensaje('')
    }, 3000)
  }

  return (
    <Layout>

      <div className="page system-page">

        <div className="system-heading">

          <div>
            <div className="eyebrow">
              <Palette size={16} />
              PERSONALIZACIÓN
            </div>

            <h1>Configuración del sistema</h1>

            <p>
              Personaliza la apariencia de Control Comidas.
              Los cambios se guardan únicamente en este navegador.
            </p>
          </div>

          <button
            className="primary inline system-save"
            onClick={guardar}
          >
            <Save size={18} />
            Guardar cambios
          </button>

        </div>


        {mensaje && (
          <div className="system-success">
            <Check size={18} />
            {mensaje}
          </div>
        )}


        <div className="system-grid">

          {/* IDENTIDAD */}

          <section className="system-card">

            <div className="system-card-title">

              <div className="system-card-icon">
                <Monitor size={21} />
              </div>

              <div>
                <h2>Identidad</h2>
                <p>
                  Define cómo se identifica el sistema.
                </p>
              </div>

            </div>


            <div className="system-field">

              <label>Nombre del sistema</label>

              <input
                value={config.nombreSistema}
                maxLength={30}
                onChange={e =>
                  cambiar(
                    'nombreSistema',
                    e.target.value
                  )
                }
              />

              <small>
                Este nombre aparecerá en el menú principal.
              </small>

            </div>


            <div className="system-field">

              <label>Iniciales</label>

              <input
                value={config.iniciales}
                maxLength={3}
                onChange={e =>
                  cambiar(
                    'iniciales',
                    e.target.value.toUpperCase()
                  )
                }
              />

              <small>
                Se mostrarán dentro del logotipo lateral.
              </small>

            </div>


            <div className="brand-preview">

              <div
                className="brand-preview-mark"
                style={{
                  background: config.colorPrincipal
                }}
              >
                {config.iniciales || 'CC'}
              </div>

              <div>
                <strong>
                  {config.nombreSistema || 'Control Comidas'}
                </strong>

                <span>Vista previa</span>
              </div>

            </div>

          </section>


          {/* COLORES */}

          <section className="system-card">

            <div className="system-card-title">

              <div className="system-card-icon">
                <Palette size={21} />
              </div>

              <div>
                <h2>Colores</h2>
                <p>
                  Personaliza los colores principales.
                </p>
              </div>

            </div>


            <div className="color-setting">

              <div>
                <strong>Color principal</strong>
                <span>
                  Botones, indicadores y elementos destacados.
                </span>
              </div>

              <div className="color-control">

                <input
                  type="color"
                  value={config.colorPrincipal}
                  onChange={e =>
                    cambiar(
                      'colorPrincipal',
                      e.target.value
                    )
                  }
                />

                <code>
                  {config.colorPrincipal.toUpperCase()}
                </code>

              </div>

            </div>


            <div className="color-setting">

              <div>
                <strong>Color del menú</strong>
                <span>
                  Fondo principal del sidebar.
                </span>
              </div>

              <div className="color-control">

                <input
                  type="color"
                  value={config.colorSidebar}
                  onChange={e =>
                    cambiar(
                      'colorSidebar',
                      e.target.value
                    )
                  }
                />

                <code>
                  {config.colorSidebar.toUpperCase()}
                </code>

              </div>

            </div>


            <div className="color-presets">

              <span>Colores rápidos</span>

              <div>

                {[
                  '#f59e0b',
                  '#2563eb',
                  '#7c3aed',
                  '#059669',
                  '#dc2626',
                  '#0891b2'
                ].map(color => (

                  <button
                    key={color}
                    type="button"
                    title={color}
                    style={{ background: color }}
                    className={
                      config.colorPrincipal === color
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      cambiar('colorPrincipal', color)
                    }
                  />

                ))}

              </div>

            </div>

          </section>


          {/* TEMA */}

          <section className="system-card">

            <div className="system-card-title">

              <div className="system-card-icon">
                {config.tema === 'oscuro'
                  ? <Moon size={21} />
                  : <Sun size={21} />
                }
              </div>

              <div>
                <h2>Apariencia</h2>
                <p>
                  Selecciona el modo de visualización.
                </p>
              </div>

            </div>


            <div className="theme-options">

              <button
                type="button"
                className={
                  config.tema === 'claro'
                    ? 'theme-option active'
                    : 'theme-option'
                }
                onClick={() =>
                  cambiar('tema', 'claro')
                }
              >
                <Sun size={24} />

                <div>
                  <strong>Claro</strong>
                  <span>
                    Fondo claro tradicional
                  </span>
                </div>

                {config.tema === 'claro' &&
                  <Check size={18} />
                }

              </button>


              <button
                type="button"
                className={
                  config.tema === 'oscuro'
                    ? 'theme-option active'
                    : 'theme-option'
                }
                onClick={() =>
                  cambiar('tema', 'oscuro')
                }
              >
                <Moon size={24} />

                <div>
                  <strong>Oscuro</strong>
                  <span>
                    Interfaz oscura
                  </span>
                </div>

                {config.tema === 'oscuro' &&
                  <Check size={18} />
                }

              </button>

            </div>

          </section>


          {/* SIDEBAR */}

          <section className="system-card">

            <div className="system-card-title">

              <div className="system-card-icon">
                <PanelLeft size={21} />
              </div>

              <div>
                <h2>Menú lateral</h2>
                <p>
                  Controla el tamaño del menú principal.
                </p>
              </div>

            </div>


            <div className="system-toggle-row">

              <div>
                <strong>Menú compacto</strong>

                <span>
                  Oculta los textos y muestra únicamente
                  los iconos.
                </span>
              </div>


              <button
                type="button"
                className={
                  config.sidebarCompacto
                    ? 'system-switch active'
                    : 'system-switch'
                }
                onClick={() =>
                  cambiar(
                    'sidebarCompacto',
                    !config.sidebarCompacto
                  )
                }
              >
                <span />
              </button>

            </div>

          </section>

        </div>


        <div className="system-reset">

          <div>
            <strong>Restaurar configuración</strong>

            <span>
              Regresa a los colores, nombre y apariencia
              originales.
            </span>
          </div>

          <button
            type="button"
            className="reset-button"
            onClick={restaurar}
          >
            <RotateCcw size={17} />
            Restaurar
          </button>

        </div>

      </div>

    </Layout>
  )
}