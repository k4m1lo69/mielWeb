package cl.mielweb.service;

import cl.mielweb.model.Producto;
import cl.mielweb.model.ProductoRequest;
import cl.mielweb.repository.ProductoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductoService {
    private final ProductoRepository repository;

    public ProductoService(ProductoRepository repository) {
        this.repository = repository;
    }

    public List<Producto> listar() {
        return repository.findAll();
    }

    public Producto obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    public Producto crear(ProductoRequest request) {
        Producto producto = new Producto();
        actualizarDatos(producto, request);
        return repository.save(producto);
    }

    public Producto actualizar(Long id, ProductoRequest request) {
        Producto producto = obtener(id);
        actualizarDatos(producto, request);
        return repository.save(producto);
    }

    public void eliminar(Long id) {
        Producto producto = obtener(id);
        repository.delete(producto);
    }

    private void actualizarDatos(Producto producto, ProductoRequest request) {
        producto.setNombre(request.nombre().trim());
        producto.setFormato(request.formato().trim());
        producto.setPrecio(request.precio());
        producto.setDescripcion(request.descripcion().trim());
        producto.setStock(request.stock());
        producto.setCategoria(request.categoria().trim());
        producto.setEmoji(
            request.emoji() == null || request.emoji().isBlank()
                ? "🍯" : request.emoji().trim()
        );
        producto.setImagen(request.imagen());
    }
}