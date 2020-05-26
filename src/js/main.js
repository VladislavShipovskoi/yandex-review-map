import {
    createClusterer,
    loadDataFromStorage,
    addMarkerToMap,
    submitHandler,
    showEmptyReviewForm,
    hidePopup,
} from './modules/yandex';

import '../sass/main.scss';

const MAPS_CONFIG = {
    center: [55.75357215512277, 37.62027063287512],
    zoom: 14,
    controls: ['zoomControl'],
};

const init = () => {
    const yaMap = new ymaps.Map('ymaps', MAPS_CONFIG);
    const yaClusterer = createClusterer(yaMap);
    const reviewsForm = document.querySelector('#reviews__form');

    reviewsForm.map = yaMap;
    reviewsForm.clusterer = yaClusterer;
    reviewsForm.addEventListener('submit', submitHandler);

    yaMap.events.add('click', async function (e) {
        const coords = e.get('coords');
        async function geocoder(coords) {
            var response = await ymaps.geocode(coords);
            return response.geoObjects.get(0).getAddressLine();
        }

        var address = await geocoder(coords);
        reviewsForm.point = coords;
        showEmptyReviewForm(coords, address);
    });

    let markers = loadDataFromStorage();
    if (markers) {
        markers.forEach((marker) => {
            addMarkerToMap(yaMap, yaClusterer, marker);
        });
    }

    document.querySelector('#reviews__close').addEventListener('click', hidePopup);
};

ymaps.ready(init);
