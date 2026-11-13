package cl.mielweb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;

@SpringBootTest
@AutoConfigureMockMvc
class MielWebApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void crudCompletoDebeFuncionar() throws Exception {

        String producto = objectMapper.writeValueAsString(Map.of(
            "nombre", "Miel de Ulmo Test",
            "formato", "500g",
            "precio", 5990,
            "descripcion", "Producto para pruebas automatizadas",
            "stock", 25,
            "categoria", "Pruebas",
            "emoji", "🍯",
            "imagen", ""
        ));

        // 1. Crear producto
        MvcResult crear = mockMvc.perform(post("/api/productos")
                .with(httpBasic("admin-test", "test-only-password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(producto))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.nombre").value("Miel de Ulmo Test"))
            .andReturn();

        JsonNode respuesta = objectMapper.readTree(
            crear.getResponse().getContentAsString()
        );

        long id = respuesta.get("id").asLong();

        // 2. Consultar por ID
        mockMvc.perform(get("/api/productos/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id));

        // 3. Listar productos
        mockMvc.perform(get("/api/productos"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id));

        String actualizado = objectMapper.writeValueAsString(Map.of(
            "nombre", "Miel de Ulmo Premium",
            "formato", "1kg",
            "precio", 10990,
            "descripcion", "Producto actualizado mediante pruebas",
            "stock", 40,
            "categoria", "Premium",
            "emoji", "🍯",
            "imagen", ""
        ));

        // 4. Actualizar producto
        mockMvc.perform(put("/api/productos/{id}", id)
                .with(httpBasic("admin-test", "test-only-password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(actualizado))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nombre").value("Miel de Ulmo Premium"))
            .andExpect(jsonPath("$.precio").value(10990));

        // 5. Eliminar producto
        mockMvc.perform(delete("/api/productos/{id}", id)
                .with(httpBasic("admin-test", "test-only-password")))
            .andExpect(status().isNoContent());

        // 6. Verificar que ya no existe
        mockMvc.perform(get("/api/productos/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("Producto no encontrado"));
    }

    @Test
    void lecturasSonPublicasYEscriturasRequierenAdministrador() throws Exception {

        String producto = """
            {
                "nombre": "Miel Seguridad Test",
                "formato": "500g",
                "precio": 5990,
                "descripcion": "Prueba de autorizacion",
                "stock": 10,
                "categoria": "Pruebas",
                "emoji": "🍯",
                "imagen": ""
            }
            """;

        // GET público
        mockMvc.perform(get("/api/productos"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/productos/999999"))
            .andExpect(status().isNotFound());

        // POST, PUT y DELETE requieren autenticación
        mockMvc.perform(post("/api/productos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(producto))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/productos/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(producto))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/productos/1"))
            .andExpect(status().isUnauthorized());

        // Credenciales incorrectas tampoco autorizan
        mockMvc.perform(post("/api/productos")
                .with(httpBasic("admin-test", "clave-incorrecta"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(producto))
            .andExpect(status().isUnauthorized());
    }
    @Test
    void noDebeAceptarUnProductoConDatosInvalidos() throws Exception {

        String invalido = """
            {
                "nombre": "",
                "formato": "",
                "precio": 0,
                "descripcion": "",
                "stock": -1,
                "categoria": "",
                "emoji": "🍯",
                "imagen": ""
            }
            """;

        mockMvc.perform(post("/api/productos")
                .with(httpBasic("admin-test", "test-only-password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalido))
            .andExpect(status().isBadRequest())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                org.junit.jupiter.api.Assertions.assertTrue(body.contains("nombre"));
                org.junit.jupiter.api.Assertions.assertTrue(body.contains("formato"));
                org.junit.jupiter.api.Assertions.assertTrue(body.contains("precio"));
                org.junit.jupiter.api.Assertions.assertTrue(body.contains("descripcion"));
                org.junit.jupiter.api.Assertions.assertTrue(body.contains("stock"));
                org.junit.jupiter.api.Assertions.assertTrue(body.contains("categoria"));
            });
    }
}