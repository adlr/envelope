'use strict';

// name, width, height, fromleft, fromtop, toleft, totop
let ENVELOPE_SIZES = [
    ['#10', '9.5in', '4.125in', '0.2in', '0.2in', '4in', '2in'],
    ['A-6', '6.5in', '4.75in', '0.2in', '0.2in', '2.4in', '2.2in'],
];

window.addEventListener('load', (event) => {
    CSS_PAGE_SIZER = new CssPageSizer();
    setupEnvelopeSizes();
    fixupList('rotate-direction', (rotateStr, evt) => {
	updateRotation();
	updateURL();
	evt.preventDefault();
    });
    document.getElementById('rotated').addEventListener('change', (evt) => {
	updateRotation();
	updateEnvelopeSize();
	updateURL();
    });
    // fixupList('inset-type', (insetStr, evt) => {
    // 	console.log(`clicked ${insetStr}`);
    // 	evt.preventDefault();
    // });

    // Restore values from URL
    loadURL();
    makeInputBoxMovable('to');
    makeInputBoxMovable('from');
    updateRotation();
    updateEnvelopeSize();
});

function makeInputBoxMovable(id) {
    const elt = document.getElementById(id);

    elt.addEventListener('input', (evt) => {
	elt.style.width = '50px';
	elt.style.height = '25px';
	elt.style.width = (10 + elt.scrollWidth) + 'px';
	elt.style.height = (5 + elt.scrollHeight) + 'px';
	updateURL();
    });
    elt.dispatchEvent(new Event('input', { 'bubbles': true }));

    let dragging = false;
    const offset = [0, 0];
    elt.addEventListener('pointerdown', (evt) => {
	if (!evt.shiftKey)
	    return;
	dragging = true;
	offset[0] = elt.offsetLeft - evt.clientX;
	offset[1] = elt.offsetTop - evt.clientY;
    });
    elt.addEventListener('pointermove', (evt) => {
	if (!dragging)
	    return;
	elt.style.left = (evt.clientX + offset[0])/96 + 'in';
	elt.style.top = (evt.clientY + offset[1])/96 + 'in';
	evt.preventDefault();
    });
    elt.addEventListener('pointerup', (evt) => {
	if (!dragging)
	    return;
	dragging = false;
	evt.preventDefault();
    });
    elt.style.left = (elt.offsetLeft/96) + 'in';
    elt.style.top = (elt.offsetTop/96) + 'in';
}

function setupEnvelopeSizes() {
    // Fill envelope sizes
    const ul = document.getElementById('env-sizes-list');
    for (let elt of ENVELOPE_SIZES) {
	const li = document.createElement('LI');
	li.innerText = elt[0];
	ul.appendChild(li);
	ul.appendChild(document.createTextNode(' '));
    }
    const inputWidth = document.getElementById('input-width');
    const inputHeight = document.getElementById('input-height');
    const from = document.getElementById('from');
    const to = document.getElementById('to');
    fixupList('env-sizes-list', (node) => {
	let details = ENVELOPE_SIZES.find(elt => elt[0] === node.innerText)
	inputWidth.value = details[1];
	inputWidth.dispatchEvent(new Event('input', { 'bubbles': true }));
	inputHeight.value = details[2];
	inputHeight.dispatchEvent(new Event('input', { 'bubbles': true }));
	// set from and to locations
	from.style.left = details[3];
	from.style.top = details[4];
	to.style.left = details[5];
	to.style.top = details[6];
	updateURL();
    });
    const isValidInput = (input) => {
	const pattern = /^(\d*\.?\d*)([a-z]{2})$/;
	const match = input.match(pattern);
	return match && match[1] && ['in', 'cm', 'mm', 'pt'].includes(match[2]);
    };
    [inputWidth, inputHeight].forEach((elt) => {
	elt.addEventListener('input', () => {
	    if (isValidInput(elt.value)) {
		elt.classList.remove('invalid-input');
		updateEnvelopeSize();
	    } else {
		elt.classList.add('invalid-input');
	    }
	});
    });
}

class CssPageSizer {
    constructor() {
	this.style = document.createElement("STYLE");
	document.head.appendChild(this.style);
    }
    setSize(width, height) {
	this.style.innerHTML = `@page{size: ${width} ${height};}`;
    }
}
let CSS_PAGE_SIZER = null;

function updateEnvelopeSize() {
    const envelope = document.getElementById('envelope');
    const width = document.getElementById('input-width').value;
    const height = document.getElementById('input-height').value;
    envelope.style.setProperty('--env-width', width);
    envelope.style.setProperty('--env-height', height);
    const rotate = document.getElementById('rotated').checked;
    if (rotate) {
	CSS_PAGE_SIZER.setSize(height, width);
    } else {
	CSS_PAGE_SIZER.setSize(width, height);
    }
    updateURL();
}

function updateRotation() {
    const rotate = document.getElementById('rotated').checked;
    const ccw = document.getElementById('rotate-direction').getElementsByClassName(
	'list-selected')[0].innerText === 'counter-clockwise';
    const envelope = document.getElementById('envelope');
    if (!rotate) {
	envelope.classList.remove('cw');
	envelope.classList.remove('ccw');
    } else if (ccw) {
	envelope.classList.remove('cw');
	envelope.classList.add('ccw');
    } else {
	envelope.classList.add('cw');
	envelope.classList.remove('ccw');
    }
}

function fixupList(id, callback) {
    let ul = document.getElementById(id);
    let supportsSelect = false;
    let lis = ul.getElementsByTagName('LI');
    for (let li of lis) {
	if (!supportsSelect && li.classList.contains('list-selected'))
	    supportsSelect = true;
	li.addEventListener('click', (evt) => {
	    if (supportsSelect) {
		// move selection
		for (let child of lis) {
		    if (child === li) {
			child.classList.add('list-selected');
		    } else {
			child.classList.remove('list-selected');
		    }
		}
	    }
	    if (callback)
		callback(li, evt);
	});
    }
}

function updateURL() {
    let parts = [];
    const from = document.getElementById('from');
    const to = document.getElementById('to');
    const fromaddr = from.value;
    if (fromaddr) {
	parts.push(`from=${encodeURIComponent(fromaddr)}`);
    }
    const toaddr = to.value;
    if (toaddr) {
	parts.push(`to=${encodeURIComponent(toaddr)}`);
    }
    const envelope = document.getElementById('envelope');
    parts.push(`width=${encodeURIComponent(getComputedStyle(envelope).getPropertyValue('--env-width'))}`);
    parts.push(`height=${encodeURIComponent(getComputedStyle(envelope).getPropertyValue('--env-height'))}`);
    parts.push(`fromleft=${encodeURIComponent(from.style.left)}`);
    parts.push(`fromtop=${encodeURIComponent(from.style.top)}`);
    parts.push(`toleft=${encodeURIComponent(to.style.left)}`);
    parts.push(`totop=${encodeURIComponent(to.style.top)}`);
    if (envelope.classList.contains('cw')) {
	parts.push(`rot=cw`);
    } else if (envelope.classList.contains('ccw')) {
	parts.push(`rot=ccw`);
    }
    document.getElementById('selflink').href = '#' + parts.join('&');
}

function loadURL() {
    const idx = document.location.href.indexOf('#');
    if (idx < 0)
	return;
    const parts = document.location.href.substring(idx + 1).split('&');
    let setRot = false;
    for (const part of parts) {
	const subparts = part.split('=', 2);
	if (subparts.length !== 2 || !subparts[1])
	    continue;
	switch (subparts[0]) {
	case 'from':
	    document.getElementById('from').value = decodeURIComponent(subparts[1]);
	    break;
	case 'to':
	    document.getElementById('to').value = decodeURIComponent(subparts[1]);
	    break;
	case 'width':
	    const inputWidth = document.getElementById('input-width');
	    inputWidth.value = decodeURIComponent(subparts[1]);
	    inputWidth.dispatchEvent(new Event('input', { 'bubbles': true }));
	    break;
	case 'height':
	    const inputHeight = document.getElementById('input-height');
	    inputHeight.value = decodeURIComponent(subparts[1]);
	    inputHeight.dispatchEvent(new Event('input', { 'bubbles': true }));
	    break;
	case 'fromleft':
	    document.getElementById('from').style.left = decodeURIComponent(subparts[1]);
	    break;
	case 'fromtop':
	    document.getElementById('from').style.top = decodeURIComponent(subparts[1]);
	    break;
	case 'toleft':
	    document.getElementById('to').style.left = decodeURIComponent(subparts[1]);
	    break;
	case 'totop':
	    document.getElementById('to').style.top = decodeURIComponent(subparts[1]);
	    break;
	case 'rot':
	    setRot = true;
	    document.getElementById('rotated').checked = true;
	    const ul = document.getElementById('rotate-direction');
	    for (const li of ul.getElementsByTagName('LI')) {
		if (li.innerText === 'clockwise' && subparts[1] === 'cw')
		    li.dispatchEvent(new Event('click', { 'bubbles': true }));
		if (li.innerText === 'counter-clockwise' && subparts[1] === 'ccw')
		    li.dispatchEvent(new Event('click', { 'bubbles': true }));
	    }
	}
    }
    if (!setRot) {
	document.getElementById('rotated').checked = false;
    }
}
