import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPermissions() {
    console.log('🔧 Configurando permisos en la base de datos...');

    const permisosNecesarios = [
        { descripcion: 'creador' },
        { descripcion: 'vista' },
        { descripcion: 'editar' },
        { descripcion: 'comentar' }
    ];

    for (const permiso of permisosNecesarios) {
        const existe = await prisma.permisos.findFirst({
            where: { descripcion: permiso.descripcion }
        });

        if (!existe) {
            const nuevo = await prisma.permisos.create({
                data: permiso
            });
            console.log(`✅ Permiso creado: ${permiso.descripcion} (ID: ${nuevo.id_permiso})`);
        } else {
            console.log(`ℹ️ Permiso ya existe: ${permiso.descripcion} (ID: ${existe.id_permiso})`);
        }
    }

    // Listar todos los permisos
    const todosLosPermisos = await prisma.permisos.findMany();
    console.log('\n📋 Permisos disponibles en la base de datos:');
    todosLosPermisos.forEach(p => {
        console.log(`   - ${p.descripcion} (ID: ${p.id_permiso})`);
    });

    await prisma.$disconnect();
    console.log('\n✅ Configuración completada');
}

setupPermissions()
    .catch((error) => {
        console.error('❌ Error al configurar permisos:', error);
        process.exit(1);
    });
