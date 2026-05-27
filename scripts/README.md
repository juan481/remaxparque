# Scripts — RE/MAX Academia

## bulk-import-courses.js

Importa cursos masivamente desde archivos JSON a la base de datos Supabase.

### Flujo de trabajo recomendado

**Paso 1 — Preparar los archivos JSON**

Copiá las plantillas y renombralas:
```
scripts/data/academia1.template.json  →  scripts/data/academia1.json
scripts/data/academia3.template.json  →  scripts/data/academia3.json
```

Editá cada archivo con el contenido real de tus documentos. Campos disponibles:

| Campo               | Tipo                             | Requerido |
|---------------------|----------------------------------|-----------|
| `title`             | string                           | ✅ Sí     |
| `description`       | string \| null                   | No        |
| `category`          | string (ej: "Ventas")            | No        |
| `difficulty`        | "basico" \| "intermedio" \| "avanzado" | No  |
| `duration_minutes`  | number                           | No        |
| `instructor`        | string                           | No        |
| `video_url`         | string (URL de Drive/YouTube)    | No        |
| `pdf_url`           | string (URL de Drive)            | No        |
| `thumbnail_url`     | string (URL de imagen)           | No        |
| `is_published`      | true \| false                    | No (default: false) |
| `parque`            | "parque1" \| "parque3" \| "both" | No (default: both) |

**Paso 2 — Probar sin escribir (recomendado)**

```bash
node scripts/bulk-import-courses.js --dry-run
```

Esto muestra una preview de lo que se importaría sin modificar la base de datos.

**Paso 3 — Importar**

```bash
# Importar ambos parques
node scripts/bulk-import-courses.js

# Solo Parque 1
node scripts/bulk-import-courses.js --parque1

# Solo Parque 3
node scripts/bulk-import-courses.js --parque3
```

### Workflow desde tus documentos PPT/DOCX

1. Abrí tu documento fuente (el que tiene el contenido etiquetado como "Academia 1" / "Academia 3")
2. Para cada módulo/tema, creá un objeto en el JSON correspondiente
3. Los videos subí a Google Drive → clic derecho → "Obtener enlace" → copiá la URL
4. Los PDFs de apoyo igual — URL de Drive
5. Ejecutá el dry-run, revisá la preview, luego importá

### Ejemplo de archivo listo

```json
[
  {
    "title": "Captación de Propiedades",
    "description": "Técnicas de captación, presentación del servicio y manejo de objeciones.",
    "category": "Ventas",
    "difficulty": "basico",
    "duration_minutes": 45,
    "instructor": "Juan García",
    "video_url": "https://drive.google.com/file/d/1abc123/view",
    "pdf_url": "https://drive.google.com/file/d/1xyz789/view",
    "is_published": true,
    "parque": "parque1"
  }
]
```
