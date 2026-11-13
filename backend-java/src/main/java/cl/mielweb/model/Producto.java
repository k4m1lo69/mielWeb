package cl.mielweb.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "productos")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 40)
    private String formato;

    @Column(nullable = false)
    private Integer precio;

    @Column(nullable = false, length = 1000)
    private String descripcion;

    // Nullable para conservar compatibilidad con registros H2 anteriores.
    @Column
    private Integer stock;

    @Column(length = 80)
    private String categoria;

    @Column(nullable = false, length = 16)
    private String emoji = "🍯";

    @Column(length = 255)
    private String imagen;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getFormato() { return formato; }
    public Integer getPrecio() { return precio; }
    public String getDescripcion() { return descripcion; }
    public Integer getStock() { return stock == null ? 0 : stock; }
    public String getCategoria() {
        return categoria == null || categoria.isBlank() ? "General" : categoria;
    }
    public String getEmoji() { return emoji; }
    public String getImagen() { return imagen; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setFormato(String formato) { this.formato = formato; }
    public void setPrecio(Integer precio) { this.precio = precio; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public void setStock(Integer stock) { this.stock = stock; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
    public void setImagen(String imagen) { this.imagen = imagen; }
}