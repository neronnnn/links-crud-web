import sqlite3

# Función para conectar a la base de datos (crea el archivo si no existe)
def conectar_bd(nombre_bd=r"app\models\links.db"):
    return sqlite3.connect(nombre_bd)

# Función para crear una tabla
def crear_tabla():
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            name TEXT NOT NULL,
            img_src TEXT NOT NULL
        )
    ''')
    conexion.commit()
    conexion.close()

# Función para insertar datos
def insertar_empleado(nombre, edad, salario):
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute('''
        INSERT INTO empleados (nombre, edad, salario) 
        VALUES (?, ?, ?)
    ''', (nombre, edad, salario))
    conexion.commit()
    conexion.close()

# Función para obtener todos los empleados
def obtener_empleados():
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute('SELECT * FROM empleados')
    empleados = cursor.fetchall()
    conexion.close()
    return empleados

# Función para actualizar un empleado por ID
def actualizar_empleado(id_empleado, nuevo_nombre, nueva_edad, nuevo_salario):
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute('''
        UPDATE empleados 
        SET nombre = ?, edad = ?, salario = ? 
        WHERE id = ?
    ''', (nuevo_nombre, nueva_edad, nuevo_salario, id_empleado))
    conexion.commit()
    conexion.close()

# Función para eliminar un empleado por ID
def eliminar_empleado(id_empleado):
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute('DELETE FROM empleados WHERE id = ?', (id_empleado,))
    conexion.commit()
    conexion.close()

# Función para eliminar todos los datos de una tabla
def eliminar_todos_los_datos(nombre_tabla):
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute(f'DELETE FROM {nombre_tabla}')
    conexion.commit()
    conexion.close()

# Función para actualizar el nombre de una tabla
def actualizar_nombre_tabla(nombre_actual, nuevo_nombre):
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute(f'ALTER TABLE {nombre_actual} RENAME TO {nuevo_nombre}')
    conexion.commit()
    conexion.close()

# Función para agregar una nueva columna a una tabla
def agregar_columna(nombre_tabla, nombre_columna, tipo_dato):
    conexion = conectar_bd()
    cursor = conexion.cursor()
    cursor.execute(f'ALTER TABLE {nombre_tabla} ADD COLUMN {nombre_columna} {tipo_dato}')
    conexion.commit()
    conexion.close()

from werkzeug.security import generate_password_hash
print(generate_password_hash('123LSSop123'))

# Código de prueba
if __name__ == "__main__":
    agregar_columna('Links', 'position', 'INTEGER')