import { adjustWidth, debounce, isValidUrl } from './utils.js';

document.addEventListener('DOMContentLoaded', function () {
  const linkForm = document.getElementById('createLink-Form')
  const imageInput = document.getElementById('imageInput')
  const urlInput = document.getElementById('urlInput')
  const nameInput = document.getElementById('nameInput')

  const linkList = document.getElementById('link-list');

  const trashCan = document.getElementById('trash-can');
  const trashCanLid = document.getElementById('trash-can__lid');
  const trashCanBody = document.getElementById('trash-can__body');

  let draggedItem = null;
  let previewItem = null;
  let previewIconUrl = null;
  let defaultIconUrl = '../../static/images/default-preview.png'
  let fetchedFaviconBlob = null;

  let editingLink = null

  let linkBeforeEdit = null

  function showCreateForm() {
    editingLink.querySelector(`.edit-overlay`).classList.add('edit-overlay--hover')
    editingLink.classList.add('link-list__item')
    editingLink.classList.remove('link-list__item-preview')
    editingLink.querySelector(`.link-url`).classList.add('link-url--invisible')

    document.querySelector(`.edit-buttons`).classList.add('edit-buttons--invisible')
    document.querySelector(`.form-create`).classList.remove('form-create--invisible')
  }

  function hideCreateForm() {
    editingLink.querySelector(`.edit-overlay`).classList.remove('edit-overlay--hover')
    editingLink.classList.remove('link-list__item')
    editingLink.classList.add('link-list__item-preview')
    editingLink.querySelector(`.link-url`).classList.remove('link-url--invisible')

    document.querySelector(`.edit-buttons`).classList.remove('edit-buttons--invisible')
    document.querySelector(`.form-create`).classList.add('form-create--invisible')
  }

  // Ejecutar al cargar y cuando cambie el contenido
  document.querySelectorAll('.link-name').forEach(input => {
    adjustWidth(input);
    input.addEventListener('input', () => adjustWidth(input));
  });

  function updatePreviewItem() {
    if (previewIconUrl || nameInput.value.trim() || urlInput.value.trim()) {
      if (!previewItem) {
        previewItem = document.createElement('li');
        previewItem.className = 'link-list__item-preview';

        const img = document.createElement('img')
        img.className = 'link-image-preview'
        img.alt = 'Previsualización'
        previewItem.appendChild(img)

        const span = document.createElement('span');
        span.className = 'link-name-preview';
        previewItem.appendChild(span)

        linkList.appendChild(previewItem);
      }
      const img = previewItem.querySelector('.link-image-preview');
      const span = previewItem.querySelector('.link-name-preview');

      img.src = previewIconUrl || defaultIconUrl
      span.textContent = nameInput.value.trim() || 'Nuevo enlace'
    } else if (previewItem) {
      previewItem.remove();
      previewItem = null;
    }
  }

  function handleImageInput(e) {
    const file = e.target.files[0];
    if (previewIconUrl) URL.revokeObjectURL(previewIconUrl);
    previewIconUrl = file ? URL.createObjectURL(file) : null;
    updatePreviewItem()
  }

  const handleUrlInput = debounce(function (e) {
    const url = isValidUrl(e.target.value.trim())
    console.log(url.isValid)
    if (!e.target.value.trim()) {
      defaultIconUrl = '../../static/images/default-preview.png'
      fetchedFaviconBlob = null
      updatePreviewItem()
      return
    }
    if (!previewIconUrl && url.isValid) {
      fetch(`/admin/get-favicon?url=${url.url}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al obtener el favicon');
          }
          return response.blob(); // Convertir la respuesta a Blob
        })
        .then(blob => {
          fetchedFaviconBlob = blob
          defaultIconUrl = URL.createObjectURL(blob);
          updatePreviewItem()
        })
        .then()
        .catch(error => {
          console.error('Error:', error);
        });
    }
    if (!url.isValid) {
      defaultIconUrl = '../../static/images/default-preview.png'
      updatePreviewItem()
    }
  }, 1000)

  imageInput.addEventListener('change', handleImageInput);
  urlInput.addEventListener('input', function (event) { updatePreviewItem(event); handleUrlInput(event) });
  nameInput.addEventListener('input', updatePreviewItem);

  // Manejar submit del formulario
  linkForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const verifiedUrl = isValidUrl(urlInput.value.trim())

    if (!urlInput.value.trim() || !nameInput.value.trim()) {
      alert('Nombre y URL son requeridos')
      return
    }

    if (!verifiedUrl.isValid) {
      alert('URL inválida')
      return
    }

    linkForm.querySelector('#urlInput').value = verifiedUrl.url

    const formData = new FormData(linkForm);

    if (!imageInput.files[0] && fetchedFaviconBlob) {
      formData.set('image', fetchedFaviconBlob, 'image.png');
    }

    fetch('/admin/add_link', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          // Limpiar formulario
          imageInput.value = '';
          urlInput.value = '';
          nameInput.value = '';

          // Eliminar vista previa
          if (previewItem) {
            previewItem.remove();
            previewItem = null;
          }

          location.reload(true)

        } else {
          alert(data.message || 'Error al agregar el enlace');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al agregar el enlace');
      });
  });

  async function handleEditButton(linkId) {
    try {
      if (editingLink) {
        await saveEdit();
      }

      // Hacer el fetch a la ruta que maneje la consulta a la base de datos
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Convertir la respuesta a JSON
      const linkData = await response.json();
      editingLink = document.querySelector(`li[data-id="${linkData.id}"]`);

      linkBeforeEdit = {
        img: editingLink.querySelector(`.link-image__preview`).src,
        name: editingLink.querySelector(`.link-name`).value,
        url: editingLink.querySelector(`.link-url`).value
      }

      hideCreateForm()

    } catch (error) {
      console.error('Error al obtener los datos del link:', error);
    }
  }

  document.querySelectorAll('.edit-button').forEach(button => {
    button.addEventListener('click', () => handleEditButton(button.dataset.id));
  });

  function editImage(e) {
    const file = e.target.files[0];
    editingLink.querySelector(`.link-image__preview`).src = file ? URL.createObjectURL(file) : '../../static/images/default-preview.png';
  }

  document.querySelectorAll(`.link-image__input`).forEach(input => {
    input.addEventListener('change', editImage);
  });

  async function saveEdit() {
    if (editingLink) {
      if (!editingLink.querySelector(`.link-name`).value.trim()) {
        editingLink.querySelector(`.link-name`).value = linkBeforeEdit.name
      } if (!editingLink.querySelector(`.link-url`).value.trim()) {
        editingLink.querySelector(`.link-url`).value = linkBeforeEdit.url
      }

      adjustWidth(editingLink.querySelector(`.link-name`))

      showCreateForm()

      const formData = new FormData(editingLink.querySelector(`.edit-form`))

      try {
        const response = await fetch(`/admin/update-link/${editingLink.dataset.id}`, {
          method: 'PUT',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Error en la actualización');
        }

        const data = await response.json();

      } catch (error) {
        console.error('Error:', error);
        // Restaurar valores originales en caso de error
        editingLink.querySelector(`.link-name`).value = linkBeforeEdit.name;
        editingLink.querySelector(`.link-url`).value = linkBeforeEdit.url;
        alert('Error al guardar los cambios');
      }

      editingLink = null
    }
  }

  document.getElementById('acceptButton').addEventListener('click', saveEdit);

  function handleCancelButton() {
    if (editingLink) {
      console.log(editingLink.querySelector(`.edit-form`).querySelector(`.link-name`).value)

      showCreateForm()

      editingLink.querySelector(`.link-image__preview`).src = linkBeforeEdit.img
      editingLink.querySelector(`.link-name`).value = linkBeforeEdit.name
      editingLink.querySelector(`.link-url`).value = linkBeforeEdit.url

      adjustWidth(editingLink.querySelector(`.link-name`))

      editingLink = null
    }
  }

  document.getElementById('cancelButton').addEventListener('click', handleCancelButton);

  // Función para eliminar enlaces
  function deleteLink(linkId) {
    if (!linkId) {
      imageInput.value = '';
      urlInput.value = '';
      nameInput.value = '';
      previewItem.remove();
      previewItem = null;
    }

    const item = document.querySelector(`li[data-id="${linkId}"]`);
    if (!item) return;

    if (confirm('¿Estás seguro de que quieres eliminar este enlace?')) {
      item.classList.add('deleting'); // Ej. opacidad durante eliminación
      fetch(`/admin/delete_link/${linkId}`, { method: 'DELETE' })
        .then(response => {
          if (!response.ok) throw new Error('Error en red');
          return response.json();
        })
        .then(data => {
          if (data.status === 'success') {
            item.remove();
          }
        })
        .catch(() => {
          item.classList.remove('deleting');
          showToast('Error al eliminar'); // Función personalizada
        });
    }
  }
  
  new Sortable(linkList, {
    animation: 150,
    filter: ".edit-button, .link-list__item-preview",  // Selectors that do not lead to dragging (String or Function)
    preventOnFilter: false,

    onStart: function (evt) {
      const currentItems = linkList.querySelectorAll('.link-list__item');
      trashCan.classList.add('shaker');
      draggedItem = evt.item;

      currentItems.forEach((item) => {
        item.querySelector('.edit-overlay').classList.remove('edit-overlay--hover')
      })

    },

    onEnd: function () {
      const currentItems = linkList.querySelectorAll('.link-list__item');
      draggedItem = null;
      trashCan.classList.remove('shaker');
      const newPositions = {};

      currentItems.forEach((item, index) => {
        newPositions[item.dataset.id] = index;
        item.querySelector('.edit-overlay').classList.add('edit-overlay--hover')
      });

      fetch('/admin/update-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPositions)
      })
        .then(response => {
          if (!response.ok) throw new Error('Error al actualizar posiciones');
          return response.json();
        })
        .then(data => console.log('Posiciones actualizadas'))
        .catch(error => console.error('Error:', error));
    }
  });

  // Eventos para la zona de eliminación
  trashCan.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashCan.classList.remove('shaker');
    trashCanLid.classList.add('rotate-70-br-cw')
    trashCanBody.classList.add('shaker')
  });

  trashCan.addEventListener('dragleave', (e) => {
    e.preventDefault();
    trashCan.classList.add('shaker');
    trashCanLid.classList.remove('rotate-70-br-cw')
    trashCanBody.classList.remove('shaker')

  });
  
  trashCan.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedItem) {
      trashCan.classList.add('shaker');
      trashCanLid.classList.remove('rotate-70-br-cw')
      trashCanBody.classList.remove('shaker')
      const linkId = draggedItem.dataset.id;
      deleteLink(linkId);

      // Aquí puedes agregar lógica adicional para actualizar tu modelo de datos
      console.log('Elemento eliminado:', draggedItem);
    }
  });
});