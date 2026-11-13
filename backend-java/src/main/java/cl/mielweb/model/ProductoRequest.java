package cl.mielweb.model;

import jakarta.validation.constraints.*;

public record ProductoRequest(
    @NotBlank @Size(max = 100) String nombre,
    @NotBlank @Size(max = 40) String formato,
    @NotNull @Min(1) @Max(100000000) Integer precio,
    @NotBlank @Size(max = 1000) String descripcion,
    @NotNull @Min(0) @Max(10000000) Integer stock,
    @NotBlank @Size(max = 80) String categoria,
    @Size(max = 16) String emoji,
    @Size(max = 255) String imagen
) {}