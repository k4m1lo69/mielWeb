package cl.mielweb.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mielWebOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("MielWeb API")
                .description("API REST para la gestión de productos de MielWeb")
                .version("1.0.0"));
    }
}