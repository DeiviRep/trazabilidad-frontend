This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# trazabilidad-frontend



CREATE OR ALTER PROCEDURE [sst].[IS_SP_RE_PROCESAR_HISTORICO_ACUMULADO]
    @P_FECHA_PROCESO  CHAR(8),        -- Formato: YYYYMMDD
    @P_ANIO           VARCHAR(4),
    @P_MES            VARCHAR(2),
    @P_DIA            VARCHAR(2),
    @P_VERSION_CIC    VARCHAR(10) = '2.13.0.0',
    @P_VERSION_01     VARCHAR(2)  = '01'
AS
BEGIN
    SET NOCOUNT ON;

    -- =========================================================
    -- CONSTANTES Y VARIABLES GENERALES
    -- =========================================================
    DECLARE @TIPO_HISTORICO  VARCHAR(4) = 'HIS';
    DECLARE @FECHA_DT        DATE       = TRY_CAST(@P_FECHA_PROCESO AS DATE);

    -- =========================================================
    -- SECCIÓN 1: VALIDACIONES DE ENTRADA
    -- =========================================================

    -- 1.1 Validar que la fecha tenga 8 caracteres y sea una fecha real
    IF @FECHA_DT IS NULL
    BEGIN
        RAISERROR('ERROR: @P_FECHA_PROCESO no es una fecha válida: "%s". Use formato YYYYMMDD.', 16, 1, @P_FECHA_PROCESO);
        RETURN -1;
    END

    -- 1.2 Validar coherencia entre @P_FECHA_PROCESO y sus partes (año/mes/día)
    IF @P_ANIO <> LEFT(@P_FECHA_PROCESO, 4)
    OR @P_MES  <> SUBSTRING(@P_FECHA_PROCESO, 5, 2)
    OR @P_DIA  <> RIGHT(@P_FECHA_PROCESO, 2)
    BEGIN
        RAISERROR(
            'ERROR: @P_ANIO/%s, @P_MES/%s, @P_DIA/%s no coinciden con @P_FECHA_PROCESO/%s.',
            16, 1, @P_ANIO, @P_MES, @P_DIA, @P_FECHA_PROCESO
        );
        RETURN -1;
    END

    -- 1.3 Validar que la fecha sea fin de mes (requisito de negocio)
    IF @FECHA_DT <> EOMONTH(@FECHA_DT)
    BEGIN
        RAISERROR(
            'INFO: La fecha %s no es fin de mes. SE OMITE EL PROCESO.',
            0, 1, @P_FECHA_PROCESO
        ) WITH NOWAIT;
        SELECT Resultado = 'INFO: La fecha ' + @P_FECHA_PROCESO + ' no es fin de mes. SE OMITE EL PROCESO.';
        RETURN 0;
    END

    -- =========================================================
    -- SECCIÓN 2: CARGA DE TABLAS A PROCESAR
    -- =========================================================
    BEGIN TRY

        CREATE TABLE #TABLAS_A_PROCESAR (
            ID              INT IDENTITY(1,1),
            ESQUEMA_ORIGEN  VARCHAR(50),
            TABLA_ORIGEN    VARCHAR(100),
            TABLA_DESTINO   VARCHAR(100),
            C_ANIO          VARCHAR(50),
            C_MES           VARCHAR(50),
            C_DIA           VARCHAR(50),
            C_VERSION       VARCHAR(50),
            C_FECHA_CORTE   VARCHAR(50)
        );

        INSERT INTO #TABLAS_A_PROCESAR
            (ESQUEMA_ORIGEN, TABLA_ORIGEN, TABLA_DESTINO, C_ANIO, C_MES, C_DIA, C_VERSION, C_FECHA_CORTE)
        SELECT
            ESQUEMAORIGEN, TABLAORIGEN, TABLADESTINO,
            CAMPOANIO, CAMPOMES, CAMPODIA, CAMPOVERSION, CAMPOFECHACORTE
        FROM sst.TBL_CONFIG_HISTORICOS
        WHERE TIPOHISTORICO = @TIPO_HISTORICO
          AND ACTIVO = 1;

        -- 2.1 Validar que existan tablas configuradas para procesar
        DECLARE @TOTAL_TABLAS INT = (SELECT COUNT(*) FROM #TABLAS_A_PROCESAR);

        IF @TOTAL_TABLAS = 0
        BEGIN
            RAISERROR(
                'ADVERTENCIA: No hay tablas activas configuradas para TIPOHISTORICO = %s. Se omite el proceso.',
                0, 1, @TIPO_HISTORICO
            ) WITH NOWAIT;
            DROP TABLE #TABLAS_A_PROCESAR;
            RETURN 0;
        END

        RAISERROR('>>> INICIO: %d tablas a procesar para fecha %s.', 0, 1, @TOTAL_TABLAS, @P_FECHA_PROCESO) WITH NOWAIT;

        -- =========================================================
        -- SECCIÓN 3: PROCESAMIENTO EN TRANSACCIÓN
        -- Cualquier fallo revierte TODO, evitando estado inconsistente
        -- =========================================================
        BEGIN TRANSACTION;

            DECLARE @Contador       INT = 1;
            DECLARE @FilasAfectadas INT;

            -- Variables para los datos del registro actual
            DECLARE @EsquemaOrigen  VARCHAR(50),
                    @TablaOrigen    VARCHAR(100),
                    @TablaDestino   VARCHAR(100),
                    @ColAnio        VARCHAR(50),
                    @ColMes         VARCHAR(50),
                    @ColDia         VARCHAR(50),
                    @ColVersion     VARCHAR(50),
                    @ColFechaCorte  VARCHAR(50);

            -- Variables para SQL dinámico
            DECLARE @SqlDelete      NVARCHAR(MAX),
                    @SqlInsert      NVARCHAR(MAX),
                    @FiltroWhere    NVARCHAR(MAX),
                    @ColumnasSelect NVARCHAR(MAX),
                    @ValorVersion   VARCHAR(10);

            WHILE @Contador <= @TOTAL_TABLAS
            BEGIN
                -- -----------------------------------------------
                -- 3.1 Obtener datos del registro actual
                -- -----------------------------------------------
                SELECT
                    @EsquemaOrigen = ESQUEMA_ORIGEN,
                    @TablaOrigen   = TABLA_ORIGEN,
                    @TablaDestino  = TABLA_DESTINO,
                    @ColAnio       = C_ANIO,
                    @ColMes        = C_MES,
                    @ColDia        = C_DIA,
                    @ColVersion    = C_VERSION,
                    @ColFechaCorte = C_FECHA_CORTE
                FROM #TABLAS_A_PROCESAR
                WHERE ID = @Contador;

                RAISERROR('>>> [%d/%d] PROCESANDO: %s', 0, 1, @Contador, @TOTAL_TABLAS, @TablaDestino) WITH NOWAIT;

                -- -----------------------------------------------
                -- 3.2 Validar existencia física de las tablas
                -- -----------------------------------------------
                IF OBJECT_ID(@TablaDestino) IS NULL
                BEGIN
                    RAISERROR('ERROR: La tabla destino no existe: %s', 16, 1, @TablaDestino);
                    -- Cae directo al CATCH → rollback automático
                END

                DECLARE @TablaOrigenFull NVARCHAR(200) = QUOTENAME(@EsquemaOrigen) + '.' + QUOTENAME(@TablaOrigen);
                IF OBJECT_ID(@TablaOrigenFull) IS NULL
                BEGIN
                    RAISERROR('ERROR: La tabla origen no existe: %s', 16, 1, @TablaOrigenFull);
                END

                -- -----------------------------------------------
                -- 3.3 Construir el filtro WHERE dinámico
                -- -----------------------------------------------
                SET @FiltroWhere = '';

                IF @ColAnio       IS NOT NULL SET @FiltroWhere += QUOTENAME(@ColAnio)       + ' = ''' + @P_ANIO + ''' AND ';
                IF @ColMes        IS NOT NULL SET @FiltroWhere += QUOTENAME(@ColMes)        + ' = ''' + @P_MES  + ''' AND ';
                IF @ColDia        IS NOT NULL SET @FiltroWhere += QUOTENAME(@ColDia)        + ' = ''' + @P_DIA  + ''' AND ';
                IF @ColFechaCorte IS NOT NULL SET @FiltroWhere += QUOTENAME(@ColFechaCorte) + ' = ''' + CAST(@FECHA_DT AS NVARCHAR) + ''' AND ';

                IF @ColVersion IS NOT NULL
                BEGIN
                    SET @ValorVersion = CASE WHEN @ColVersion = 'VersionCIC' THEN @P_VERSION_CIC ELSE @P_VERSION_01 END;
                    SET @FiltroWhere += QUOTENAME(@ColVersion) + ' = ''' + @ValorVersion + ''' AND ';
                END

                -- Quitar el último ' AND ' sobrante
                IF LEN(@FiltroWhere) > 5
                    SET @FiltroWhere = LEFT(@FiltroWhere, LEN(@FiltroWhere) - 4);

                -- 3.3.1 Validación de seguridad: nunca ejecutar DELETE sin WHERE
                IF LEN(TRIM(ISNULL(@FiltroWhere, ''))) = 0
                BEGIN
                    RAISERROR(
                        'ERROR CRÍTICO: Filtro WHERE vacío para "%s". DELETE sin WHERE abortado por seguridad.',
                        16, 1, @TablaDestino
                    );
                END

                -- -----------------------------------------------
                -- 3.4 Construir el SELECT para el INSERT
                -- -----------------------------------------------
                SET @ColumnasSelect = 'SELECT ';

                IF @ColAnio    IS NOT NULL SET @ColumnasSelect += '''' + @P_ANIO + ''', ';
                IF @ColMes     IS NOT NULL SET @ColumnasSelect += '''' + @P_MES  + ''', ';
                IF @ColDia     IS NOT NULL SET @ColumnasSelect += '''' + @P_DIA  + ''', ';
                IF @ColVersion IS NOT NULL SET @ColumnasSelect += '''' + @ValorVersion + ''', ';
                SET @ColumnasSelect += '* ';

                -- -----------------------------------------------
                -- 3.5 Ensamblar los SQLs finales
                -- -----------------------------------------------
                SET @SqlDelete = N'DELETE FROM ' + @TablaDestino
                               + N' WHERE '      + @FiltroWhere + N';';

                SET @SqlInsert = N'INSERT INTO ' + @TablaDestino + N' '
                               + @ColumnasSelect
                               + N'FROM '        + @TablaOrigenFull;

                -- Si hay fecha de corte, filtrar también el origen
                IF @ColFechaCorte IS NOT NULL
                    SET @SqlInsert += N' WHERE ' + QUOTENAME(@ColFechaCorte)
                                   + N' = ''' + CAST(@FECHA_DT AS NVARCHAR) + N''';';

                -- -----------------------------------------------
                -- 3.6 Ejecutar: limpiar histórico e insertar
                -- -----------------------------------------------
                PRINT '-- DELETE:';
                PRINT @SqlDelete;
                EXEC sp_executesql @SqlDelete;

                PRINT '-- INSERT:';
                PRINT @SqlInsert;
                EXEC sp_executesql @SqlInsert;

                SET @FilasAfectadas = @@ROWCOUNT;

                -- -----------------------------------------------
                -- 3.7 Registrar resultado en tabla de resumen
                -- -----------------------------------------------
                INSERT INTO sst.TBL_RESUMEN_EJECUCION_HISTORICO
                VALUES (
                    @TablaDestino, @FilasAfectadas, @TablaOrigen,
                    @SqlDelete, @SqlInsert,
                    @TIPO_HISTORICO, @P_FECHA_PROCESO
                );

                RAISERROR('    OK: %d filas cargadas.', 0, 1, @FilasAfectadas) WITH NOWAIT;

                SET @Contador = @Contador + 1;
            END -- FIN WHILE

        COMMIT TRANSACTION;

        -- =========================================================
        -- SECCIÓN 4: LIMPIEZA Y RESULTADO FINAL
        -- =========================================================
        DROP TABLE #TABLAS_A_PROCESAR;

        RAISERROR('>>> FIN: Proceso completado exitosamente para fecha %s.', 0, 1, @P_FECHA_PROCESO) WITH NOWAIT;

        SELECT Resultado = '- Generación respaldo históricas (' + @TablaDestino + ')'
        FROM sst.TBL_RESUMEN_EJECUCION_HISTORICO
        WHERE FECHA_PROCESO  = @P_FECHA_PROCESO
          AND TIPO_HISTORICO = @TIPO_HISTORICO;

    END TRY
    BEGIN CATCH

        -- Revertir todo si algo falló dentro de la transacción
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        -- Limpiar tabla temporal si quedó abierta
        IF OBJECT_ID('tempdb..#TABLAS_A_PROCESAR') IS NOT NULL
            DROP TABLE #TABLAS_A_PROCESAR;

        DECLARE @MensajeError NVARCHAR(MAX) =
            'Error procesando histórico [' + ISNULL(@TablaDestino, '?') + ']: ' + ERROR_MESSAGE();

        RAISERROR(@MensajeError, 16, 1);
        RETURN -1;

    END CATCH
END;
