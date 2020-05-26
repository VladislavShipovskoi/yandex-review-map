import makeBalloonTemplate from '../../views/makeBalloonTemplate.hbs';
import reviewTemplate from '../../views/reviewTemplate.hbs';

const reviews = document.querySelector('#reviews');
const reviewsForm = document.querySelector('#reviews__form');
const title = reviews.querySelector('#reviews__header');
const reviewsContent = document.querySelector('#reviews__content');
dragElement(reviews);

export function addMarkerToMap(map, clusterer, reviewData) {
    const marker = new ymaps.Placemark(reviewData.point, {
        openBalloonOnClick: false,
        balloonContentPlace: reviewData.place,
        balloonContentComment: reviewData.comment,
        balloonContentName: reviewData.name,
        balloonContentDate: reviewData.dateTime,
        balloonContentPoint: reviewData.point.toString(),
        balloonContentAddress: reviewData.address,
    });

    map.geoObjects.add(marker);

    clusterer.add(marker);

    marker.events.add('click', (e) => {
        e.preventDefault();
        showPopupWithReviews(reviewData.point);
    });
}

function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;

    document.getElementById(elmnt.id + '__header').onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    var isOutOfViewport = function (elem) {
        var bounding = elem.getBoundingClientRect();
        var out = {};
        out.top = bounding.top < 0;
        out.left = bounding.left < 0;
        out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
        out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);
        out.any = out.top || out.left || out.bottom || out.right;
        out.all = out.top && out.left && out.bottom && out.right;

        return out;
    };

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
        elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
    }

    function closeDragElement() {
        var elem = document.querySelector('#reviews');
        var isOut = isOutOfViewport(elem);

        if (isOut.any) {
            elem.style.top = '50%';
            elem.style.left = '50%';
        }

        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function clearPopup() {
    title.childNodes[0].textContent = '-';
    reviewsContent.innerText = '';
    document.querySelector('#reviews__form input[name="name"]').value = '';
    document.querySelector('#reviews__form input[name="place"]').value = '';
    document.querySelector('#reviews__form textarea').value = '';
}

export function showEmptyReviewForm(point, address = '') {
    clearPopup();
    title.childNodes[0].textContent = address;
    reviewsContent.innerText = 'Отзывов пока нет...';
    reviews.classList.remove('hidden');
    reviewsForm.point = point;
}

function showPopupWithReviews(point) {
    clearPopup();

    let markers = loadDataFromStorage();
    let innerHTML = '<ul>';

    markers.forEach((marker) => {
        if (JSON.stringify(marker.point) === JSON.stringify(point)) {
            innerHTML += reviewTemplate({
                name: marker.name,
                time: marker.dateTime,
                place: marker.place,
                comment: marker.comment,
            });
            title.childNodes[0].textContent = marker.address;
        }
    });
    innerHTML += '</ul>';

    reviewsContent.innerHTML = innerHTML;
    reviews.classList.remove('hidden');
    reviewsForm.point = point;
}

export function hidePopup() {
    reviews.classList.add('hidden');
}

function unixToDateStr(timestamp) {
    let date = new Date(timestamp);

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDay();

    let hours = date.getHours();
    let minutes = date.getMinutes();

    month = ('0' + month).slice(-2);
    day = ('0' + day).slice(-2);
    hours = ('0' + hours).slice(-2);
    minutes = ('0' + minutes).slice(-2);

    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function createClusterer(map) {
    const customClusterBalloonContent = ymaps.templateLayoutFactory.createClass(makeBalloonTemplate('$[(properties)]'));

    const clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        openBalloonOnClick: true,
        preset: 'islands#invertedVioletClusterIcons',
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customClusterBalloonContent,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 160,
        clusterBalloonPagerSize: 10,
    });

    map.geoObjects.add(clusterer);

    clusterer.events.add('balloonopen', hidePopup);

    const onBalloonLinkClick = (e) => {
        if (e.target.id && e.target.id === 'balloon-link') {
            e.preventDefault();
            map.balloon.close();
            let pointData = e.target.dataset.point.split(',');
            let point = pointData.map(Number);

            showPopupWithReviews(point);
        }
    };

    document.addEventListener('click', onBalloonLinkClick);

    return clusterer;
}

export function submitHandler(e) {
    e.preventDefault();

    let reviewData = {
        point: this.point,
        name: document.querySelector('#reviews__form input[name="name"]').value.trim(),
        place: document.querySelector('#reviews__form input[name="place"]').value.trim(),
        comment: document.querySelector('#reviews__form textarea[name="comment"]').value.trim(),
        address: document.querySelector('#reviews__header').childNodes[0].textContent.trim(),
        dateTime: unixToDateStr(Date.now()),
    };

    if (!reviewData.name || !reviewData.place || !reviewData.comment) {
        alert('Заполните поля формы');
        return;
    }

    addMarkerToMap(this.map, this.clusterer, reviewData);
    addDataToStorage(reviewData);
    showPopupWithReviews(this.point);
}

function addDataToStorage(newData) {
    let markers = [];
    if (localStorage.getItem('markers')) {
        markers = JSON.parse(localStorage.getItem('markers'));
    }
    markers.push(newData);
    localStorage.setItem('markers', JSON.stringify(markers));
}

export function loadDataFromStorage() {
    if (localStorage.getItem('markers')) {
        return JSON.parse(localStorage.getItem('markers'));
    }
}
