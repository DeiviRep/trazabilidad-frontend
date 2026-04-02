'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Eye, X, QrCode, MapPin, Calendar } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import QRModal from '@/components/QRModal';
import RoleGuard from '@/components/RoleGuard';

type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface Evento {
  tipo: EstadoEvento;
  fecha: string;
  punto: string;
  coordenadas: [number, number];
  contenedor?: string;
  dim?: string;
  valorCIF?: number;
  totalPagado?: number;
}

interface ProductoDetalle {
  lote: string;
  uuidLote: string;
  id: string;
  marca: string;
  modelo: string;
  imeiSerial: string;
  estado: EstadoEvento;
  urlLote: string;
  fechaCreacion: string;
  eventos: {
    tipo: EstadoEvento;
    fecha: string;
    puntoControl: string;
    coordenadas: [number, number];
    contenedor?: string;
    tipoTransporte?: string;
    integridad?: boolean;
    descripcionIntegridad?: string;
    dim?: string;
    valorCIF?: number;
    totalPagado?: number;
    comerciante?: string;
    fechaCompra?: string;
    cliente?: string;
  }[];
}

interface Lote {
  id: string;
  lote: string;
  marca: string;
  modelo: string;
  cantidadProductos: number;
  estado: EstadoEvento;
  url: string;
  fechaCreacion: string;
  eventos: Evento[];
}

interface ProductosModalProps {
  isOpen: boolean;
  onClose: () => void;
  lote: Lote | null;
  productos: ProductoDetalle[];
  loading: boolean;
}

const estados: string[] = ['TODOS', 'REGISTRADO', 'EMBARCADO', 'DESEMBARCADO', 'NACIONALIZADO', 'EN_DISTRIBUCION', 'PRODUCTO_ADQUIRIDO'];

const estadoColors: Record<EstadoEvento, string> = {
  'REGISTRADO': 'bg-gray-100 text-gray-800',
  'EMBARCADO': 'bg-blue-100 text-blue-800',
  'DESEMBARCADO': 'bg-yellow-100 text-yellow-800',
  'NACIONALIZADO': 'bg-green-100 text-green-800',
  'EN_DISTRIBUCION': 'bg-purple-100 text-purple-800',
  'PRODUCTO_ADQUIRIDO': 'bg-red-100 text-red-800'
};

const ProductosModal: React.FC<ProductosModalProps> = ({ isOpen, onClose, lote, productos, loading }) => {
  const [filtroModal, setFiltroModal] = useState<string>('');
  const [estadoFiltroModal, setEstadoFiltroModal] = useState<string>('TODOS');
  const [selectedProducto, setSelectedProducto] = useState<string>('');
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [qrImage, setQrImage] = useState<string>('');
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  const productosFiltrados = productos.filter(producto => {
    const coincideTexto = producto.marca.toLowerCase().includes(filtroModal.toLowerCase()) || 
                          producto.modelo.toLowerCase().includes(filtroModal.toLowerCase()) ||
                          producto.imeiSerial.toLowerCase().includes(filtroModal.toLowerCase());
    const coincideEstado = estadoFiltroModal === 'TODOS' || producto.estado === estadoFiltroModal;
    return coincideTexto && coincideEstado;
  });

  // Estadísticas de productos
  const estadisticasProductos = productos.reduce((acc, producto) => {
    acc[producto.estado] = (acc[producto.estado] || 0) + 1;
    return acc;
  }, {} as Record<EstadoEvento, number>);

  const handleOpenQrModal = async (id: string) => {
    try {
      if (qrCache[id]) {
        setQrImage(qrCache[id]);
        setSelectedProducto(id);
        setQrModalOpen(true);
        return;
      }
    
      const response = await TrazabilidadAPI.obtenerQRBase64(id);
    
      let base64 = response?.base64;
    
      if (!base64) throw new Error("QR vacío");
    
      // 🔥 asegurar prefijo
      if (!base64.startsWith('data:image')) {
        base64 = `data:image/png;base64,${base64}`;
      }
    
      setQrCache(prev => ({ ...prev, [id]: base64 }));
    
      setQrImage(base64);
      setSelectedProducto(id);
      setQrModalOpen(true);
    
    } catch (error) {
      console.error("Error QR:", error);
    
      // fallback seguro
      setQrImage(`${process.env.NEXT_PUBLIC_API_BASE_URL}/trazabilidad/qr-image/${id}`);
      setSelectedProducto(id);
      setQrModalOpen(true);
    }
  };

  // Reset filtros cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFiltroModal('');
      setEstadoFiltroModal('TODOS');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <QRModal 
          onClose={() => setQrModalOpen(false)} 
          open={qrModalOpen} 
          imageUrl={qrImage} 
        />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Productos del Lote: {lote?.lote}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {lote?.marca} {lote?.modelo} • {productos.length} productos
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Buscar por marca, modelo o IMEI..."
                value={filtroModal}
                onChange={(e) => setFiltroModal(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <select
                value={estadoFiltroModal}
                onChange={(e) => setEstadoFiltroModal(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-500">Cargando productos...</p>
                </div>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron productos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Producto</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">IMEI/Serial</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Estado</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Última Ubicación</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Fecha</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((producto) => (
                      <tr key={producto.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{producto.marca}</p>
                              <p className="text-xs text-gray-500">{producto.modelo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-mono text-sm text-gray-900">{producto.imeiSerial}</p>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[producto.estado]}`}>
                            {producto.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {producto.eventos?.length > 0 
                                ? producto.eventos[producto.eventos.length - 1].puntoControl 
                                : 'No disponible'
                              }
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {new Date(producto.fechaCreacion).toLocaleDateString('es-BO')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex space-x-1">
                            <button 
                              className="text-green-600 hover:text-green-800 p-1" 
                              title="Ver QR"
                              onClick={() => handleOpenQrModal(producto.id)}
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Mostrando {productosFiltrados.length} de {productos.length} productos
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <Link
                href={`/lotes/${lote?.id}`}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={onClose}
              >
                Gestionar Lote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LotesPage() {
  const [filtro, setFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  const [dataLotes, setDataLotes] = useState<Lote[]>([]);
  
  // Estados del modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [productosLote, setProductosLote] = useState<ProductoDetalle[]>([]);
  const [loadingProductos, setLoadingProductos] = useState<boolean>(false);

  const cargarDatos = async () => {
    const data = await TrazabilidadAPI.listarResumenLotes();
    setDataLotes(data?.map((lote: any) => {
      return {
        id: lote.id,
        lote: lote.lote,
        marca: lote.marca,
        modelo: lote.modelo,
        cantidadProductos: lote.cantidadProductos,
        estado: lote.estadoMinimo,
        url: lote.url,
        fechaCreacion: lote.fechaCreacion,
        eventos: lote.eventos
      }
    }));
  };

  const cargarProductosLote = async (loteId: string) => {
    setLoadingProductos(true);
    try {
      const productos = await TrazabilidadAPI.listarPorLote(loteId);
      setProductosLote(productos || []);
    } catch (error) {
      console.error('Error al cargar productos del lote:', error);
      setProductosLote([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleVerProductos = async (lote: Lote) => {
    setSelectedLote(lote);
    setModalOpen(true);
    await cargarProductosLote(lote.id);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLote(null);
    setProductosLote([]);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const lotesFiltrados = dataLotes?.filter(lote => {
    const coincideTexto = lote.marca.toLowerCase().includes(filtro.toLowerCase()) || 
                          lote.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
                          lote.lote.toLowerCase().includes(filtro.toLowerCase());
    const coincideEstado = estadoFiltro === 'TODOS' || lote.estado === estadoFiltro;
    return coincideTexto && coincideEstado;
  });

  return (
    <RoleGuard allowedRoles={['ADMIN', 'PROVEEDOR', 'TRANSPORTISTA', 'ADUANA', 'DISTRIBUIDOR']}>
    <div className="space-y-6">
      {/* Modal de productos */}
      <ProductosModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        lote={selectedLote}
        productos={productosLote}
        loading={loadingProductos}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por marca, modelo o lote..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Lote</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Cantidad</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Fecha</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lotesFiltrados?.map((lote) => (
                <tr key={lote.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{lote.lote}</p>
                      <p className="text-sm text-gray-500 font-mono">{lote.id}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lote.marca}</p>
                        <p className="text-sm text-gray-500">{lote.modelo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">{lote.cantidadProductos}</span>
                      <span className="text-sm text-gray-500">unidades</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[lote.estado]}`}>
                      {lote.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(lote.fechaCreacion).toLocaleDateString('es-BO')}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerProductos(lote)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-1"
                        title="Ver productos del lote"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Productos</span>
                      </button>
                      <Link
                        href={`/lotes/${lote.id}`}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Gestionar eventos
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}