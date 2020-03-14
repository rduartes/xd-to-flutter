const { width, height } = require("./utils/width_height");
const { fillToColor } = require("./utils/fill_to_color");
const { fixDouble } = require("./utils/fix_double");
const { fillToGradient } = require("./utils/fill_to_gradient");
const { shadow } = require("./utils/shadow");
const { Rectangle } = require("scenegraph");
let application = require("application");

class Container {
    constructor(node) {
        this.node = node;
    }
    toDart() {
        let node = this.node;
        const name = node.constructor.name;
        if (name == 'Line') {
            node = new XDLine(node).parseToRectangle();
        }
        return new XDRectangle(node).toDart();
    }
}

module.exports = {
    Container: Container,
};

class XDLine {
    constructor(node) {
        this.node = node;
    }

    parseToRectangle() {
        console.log('1');
        const node = this.node;
        console.log('2');
        let rectangle;
        application.editDocument(function () {
            console.log('3');
            rectangle = new Rectangle();
            console.log('4');
            const horizontal = node.globalBounds.width >= node.globalBounds.height;
            const width = horizontal ? node.globalBounds.width : node.strokeWidth;
            const height = !horizontal ? node.globalBounds.height : node.strokeWidth;
            const radius = node.strokeEndCaps == 'round' ? Math.min(width, height) / 2 : 0;
            rectangle.width = width;
            rectangle.height = height;
            rectangle.fill = node.stroke;
            rectangle.fillEnabled = node.strokeEnabled;
            rectangle.setAllCornerRadii(radius);
            rectangle.shadow = node.shadow;
            rectangle.strokeEnabled = false;
        });
        console.log('5');
        return rectangle;
    }
}

class XDRectangle {
    constructor(node) {
        this.node = node;
    }

    toDart() {
        const node = this.node;
        const fill = (this.withDecoration() || !node.fillEnabled) ? '' : this.color();
        return `
        Container(
            ${height(node)}
            ${width(node)}
            ${fill}
            ${this.decoration()}
            ${this.child()}
        )
        `;
    }

    ellipseRadius() {
        const node = this.node;
        if (node.isCircle) {
            return "shape: BoxShape.circle,";
        } else {
            const x = fixDouble(node.radiusX * 2);
            const y = fixDouble(node.radiusY * 2);
            return `borderRadius: BorderRadius.all(Radius.elliptical(${x},${y})),`;
        }
    }

    withDecoration() {
        const hasRoundedCorners = this.borderRadius() != '';
        const hasGradient = this.gradient() != '';
        const hasBorder = this.border() != '';
        const hasShadow = this.shadow() != '';
        return hasRoundedCorners || hasGradient || hasBorder || hasShadow;
    }

    shadow() {
        const node = this.node;
        if (node.shadow != null && node.shadow.visible) {
            return `boxShadow: [
                Box${shadow(node)}
            ],`;
        }
        return '';
    }

    borderRadius() {
        const node = this.node;
        if (node.hasRoundedCorners) {
            return this.containerRadius();
        } else if (node.constructor.name == 'Ellipse') {
            return this.ellipseRadius();
        }
        return '';
    }

    containerRadius() {
        const node = this.node;
        let result = '';
        const radius = node.cornerRadii;
        const radiusSet = new Set();
        radiusSet.add(radius.topLeft);
        radiusSet.add(radius.topRight);
        radiusSet.add(radius.bottomRight);
        radiusSet.add(radius.bottomLeft);
        if (radiusSet.size == 1) {
            result = `BorderRadius.circular(${fixDouble(radius.bottomLeft)})`;
        } else {
            result = `BorderRadius.only(${this.radiusCircular('topLeft', radius.topLeft)}${this.radiusCircular('topRight', radius.topRight)}${this.radiusCircular('bottomLeft', radius.bottomLeft)}${this.radiusCircular('bottomRight', radius.bottomRight)})`;
        }
        return `borderRadius: ${result},`;
    }

    radiusCircular(tag, value) {
        if (value == 0) return '';
        return `${tag}: Radius.circular(${fixDouble(value)}),`;
    }

    border() {
        const node = this.node;
        if (node.strokeEnabled)
            return `
    border: Border.all(
        width: ${node.strokeWidth},
        color: ${fillToColor(node.stroke)},
    ),
    `; return '';
    }

    gradient() {
        const node = this.node;
        if (node.fillEnabled && node.fill.startX != null) {
            return `gradient: ${fillToGradient(node.fill)},`;
        }
        return '';
    }

    color() {
        const node = this.node;
        const color = fillToColor(node.fill);
        return `color: ${color},`;
    }



    decoration() {
        if (this.withDecoration()) {
            let fill = this.gradient();
            if (fill == '') fill = this.color();
            return `
        decoration: BoxDecoration(
            ${fill}
            ${this.border()}
            ${this.borderRadius()}
            ${this.shadow()}
        ),`;
        }
        return ``;
    }

    child() {
        return ``;
    }
}