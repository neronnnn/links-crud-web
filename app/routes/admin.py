# app/admin.py
from flask import Blueprint, render_template, request, jsonify
import requests

from werkzeug.utils import secure_filename
import os

from app import login_required, db, Config
from app.models.links_model import Links
admin = Blueprint('admin', __name__, template_folder='../templates/admin')

@admin.route('/admin')
@login_required
def links_CRUD():
    links = Links.query.order_by(Links.position).all()
    print(links)
    print(link for link in links)
    return render_template('links_CRUD.html', links=links)

@admin.route('/admin/add_link', methods=['POST'])
@login_required
def add_link():
    try:
        if not request.files.get('image'):
            print('No se ha enviado imagen')
        # Validar campos requeridos
        url = request.form.get('url')
        name = request.form.get('name')
        if not url or not name:
            return jsonify({'status': 'error', 'message': 'URL y Nombre son requeridos'}), 400

        # Calcular nueva posición
        last_position = db.session.query(db.func.max(Links.position)).scalar() or 0
        new_position = last_position + 1

        # Crear nuevo enlace con img_src temporal
        new_link = Links(
            url=url, 
            name=name, 
            position=new_position,
            img_src=''  # Se actualizará después
        )
        db.session.add(new_link)
        db.session.commit()

        # Generar nombre base para la imagen
        img_base = f'id_for_id-{new_link.id}'
        img_filename = None
        image_file = request.files.get('image')

        # Manejar imagen subida
        if image_file and image_file.filename != '':
            filename = secure_filename(image_file.filename)
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            if ext not in {'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico', 'svg', 'heic', 'heif'}:
                db.session.delete(new_link)
                db.session.commit()
                return jsonify({'status': 'error', 'message': 'Formato de imagen no válido'}), 400
            
            img_filename = f'{img_base}.{ext}'
            image_path = os.path.join(Config.UPLOAD_FOLDER, img_filename)
            image_file.save(image_path)
        else:
            # Si no se proporciona una imagen, se usa la predeterminada
            img_filename = 'default.png'

        # Actualizar enlace con nombre de imagen
        new_link.img_src = img_filename
        db.session.commit()

        return jsonify({
            'status': 'success',
            'link': {
                'id': new_link.id,
                'url': new_link.url,
                'name': new_link.name,
                'img_src': new_link.img_src,
                'position': new_link.position
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Ruta para obtener el favicon usando la API de Google
@admin.route('/admin/get-favicon')
def get_favicon():
    # Obtener la URL del parámetro de la solicitud
    domain = request.args.get('url')
    if not domain:
        return "Falta el parámetro 'domain'", 400

    # URL de la API de Google Favicon
    google_favicon_url = f'https://www.google.com/s2/favicons?domain={domain}'

    try:
        # Descargar el favicon
        response = requests.get(google_favicon_url)
        response.raise_for_status()  # Lanza una excepción si hay un error HTTP

        return response.content, 200, {'Content-Type': response.headers['Content-Type']}
    except requests.exceptions.RequestException as e:
        # Manejar errores de la solicitud
        return requests.get(request.host_url + '../../static/images/default-preview.png').content, 200, {'Content-Type': response.headers['Content-Type']}

@admin.route('/admin/delete_link/<int:link_id>', methods=['DELETE'])
@login_required
def delete_link(link_id):
    try:
        link = Links.query.get_or_404(link_id)
        deleted_position = link.position
        
        # Eliminar la imagen si existe
        if link.img_src and link.img_src != 'default.png':
            print(link.img_src)
            img_path = os.path.join(Config.UPLOAD_FOLDER, link.img_src)
            if os.path.exists(img_path):
                os.remove(img_path)
        
        # Eliminar el enlace
        db.session.delete(link)
        
        # Reordenar las posiciones de los enlaces restantes
        Links.query.filter(Links.position > deleted_position).update(
            {Links.position: Links.position - 1},
            synchronize_session=False
        )
        
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
@admin.route('/admin/update-link/<int:link_id>', methods=['PUT'])
@login_required
def update_link(link_id):
    try:
        link = Links.query.get_or_404(link_id)
        data = request.form

        # Validar campos requeridos
        url = data.get('url')
        name = data.get('name')
        if not url or not name:
            return jsonify({'status': 'error', 'message': 'URL y Nombre son requeridos'}), 400

        # Actualizar datos básicos
        link.url = url
        link.name = name

        # Manejar imagen si se proporciona una nueva
        image_file = request.files.get('image')
        if image_file and image_file.filename != '':
            filename = secure_filename(image_file.filename)
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            if ext not in {'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico', 'svg', 'heic', 'heif'}:
                return jsonify({'status': 'error', 'message': 'Formato de imagen no válido'}), 400
            
            # Eliminar imagen anterior si existe y no es la default
            if link.img_src and link.img_src != 'default.png':
                old_image_path = os.path.join(Config.UPLOAD_FOLDER, link.img_src)
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            # Guardar nueva imagen
            img_filename = f'id_for_id-{link_id}.{ext}'
            image_path = os.path.join(Config.UPLOAD_FOLDER, img_filename)
            image_file.save(image_path)
            link.img_src = img_filename

        db.session.commit()

        return jsonify({
            'status': 'success',
            'link': {
                'id': link.id,
                'url': link.url,
                'name': link.name,
                'img_src': link.img_src,
                'position': link.position
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin.route('/admin/update-positions', methods=['POST'])
@login_required
def update_positions():
    try:
        new_positions = request.json
        for item_id, position in new_positions.items():
            link = Links.query.get(int(item_id))
            if link:
                link.position = position
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
@admin.route('/api/links/<int:link_id>', methods=['GET'])
def get_link(link_id):
    try:
        # Buscar el link en la base de datos usando SQLAlchemy
        link = Links.query.get(link_id)
        
        if link is None:
            return jsonify({'error': 'Link no encontrado'}), 404
            
        # Convertir el objeto a un diccionario
        link_data = {
            'id': link.id,
            'name': link.name,
            'url': link.url,
            'img_src': link.img_src,
            'position': link.position
        }
        
        return jsonify(link_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500