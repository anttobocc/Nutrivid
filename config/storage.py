from whitenoise.storage import CompressedManifestStaticFilesStorage


class StaticConHashEnModulos(CompressedManifestStaticFilesStorage):
    """
    Igual que el storage de WhiteNoise, pero también reescribe los
    `import ... from "./modulo.js"` de los módulos ES de la tienda para que
    apunten a la versión con hash. Sin esto, main.js (con hash, cacheado por
    un año) podría combinarse con módulos viejos tras un despliegue.
    """

    support_js_module_import_aggregation = True
