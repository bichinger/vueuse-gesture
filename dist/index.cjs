'use strict';

const vueDemi = require('vue-demi');

function supportsGestureEvents() {
  try {
    return "constructor" in GestureEvent;
  } catch (e) {
    return false;
  }
}
function supportsPointerEvents() {
  try {
    return typeof window !== "undefined" && "PointerEvent" in window;
  } catch (e) {
    return false;
  }
}
function supportsTouchEvents() {
  return typeof window !== "undefined" && "ontouchstart" in window;
}
function getEventTouches(event) {
  if ("pointerId" in event)
    return null;
  return event.type === "touchend" ? event.changedTouches : event.targetTouches;
}
function getTouchIds(event) {
  return Array.from(getEventTouches(event)).map((t) => t.identifier);
}
function getGenericEventData(event) {
  const buttons = "buttons" in event ? event.buttons : 0;
  const { shiftKey, altKey, metaKey, ctrlKey } = event;
  return { buttons, shiftKey, altKey, metaKey, ctrlKey };
}
const identity$1 = (xy) => xy;
function getPointerEventValues(event, transform = identity$1) {
  const touchEvents = getEventTouches(event);
  const { clientX, clientY } = touchEvents ? touchEvents[0] : event;
  return transform([clientX, clientY]);
}
function getTwoTouchesEventValues(event, pointerIds, transform = identity$1) {
  const [A, B] = Array.from(event.touches).filter(
    (t) => pointerIds.includes(t.identifier)
  );
  if (!A || !B)
    throw Error(`The event doesn't have two pointers matching the pointerIds`);
  const dx = B.clientX - A.clientX;
  const dy = B.clientY - A.clientY;
  const cx = (B.clientX + A.clientX) / 2;
  const cy = (B.clientY + A.clientY) / 2;
  const distance = Math.hypot(dx, dy);
  const angle = -(Math.atan2(dx, dy) * 180) / Math.PI;
  const values = transform([distance, angle]);
  const origin = transform([cx, cy]);
  return { values, origin };
}
function getScrollEventValues(event, transform = identity$1) {
  const {
    scrollX,
    scrollY,
    scrollLeft,
    scrollTop
  } = event.currentTarget;
  return transform([scrollX || scrollLeft || 0, scrollY || scrollTop || 0]);
}
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;
function getWheelEventValues(event, transform = identity$1) {
  let { deltaX, deltaY, deltaMode } = event;
  if (deltaMode === 1) {
    deltaX *= LINE_HEIGHT;
    deltaY *= LINE_HEIGHT;
  } else if (deltaMode === 2) {
    deltaX *= PAGE_HEIGHT;
    deltaY *= PAGE_HEIGHT;
  }
  return transform([deltaX, deltaY]);
}
function getWebkitGestureEventValues(event, transform = identity$1) {
  return transform([event.scale, event.rotation]);
}

function noop() {
}
function chainFns(...fns) {
  if (fns.length === 0)
    return noop;
  if (fns.length === 1)
    return fns[0];
  return function() {
    var result;
    for (let fn of fns) {
      result = fn.apply(this, arguments) || result;
    }
    return result;
  };
}
function ensureVector(value, fallback) {
  if (value === void 0) {
    if (fallback === void 0) {
      throw new Error("Must define fallback value if undefined is expected");
    }
    value = fallback;
  }
  if (Array.isArray(value))
    return value;
  return [value, value];
}
function assignDefault(value, fallback) {
  return Object.assign({}, fallback, value || {});
}
function valueFn(v, ...args) {
  if (typeof v === "function") {
    return v(...args);
  } else {
    return v;
  }
}

function getInitial(mixed) {
  return {
    _active: false,
    _blocked: false,
    _intentional: [false, false],
    _movement: [0, 0],
    _initial: [0, 0],
    _bounds: [
      [-Infinity, Infinity],
      [-Infinity, Infinity]
    ],
    _lastEventType: void 0,
    _dragStarted: false,
    _dragPreventScroll: false,
    _dragIsTap: true,
    _dragDelayed: false,
    event: void 0,
    intentional: false,
    values: [0, 0],
    velocities: [0, 0],
    delta: [0, 0],
    movement: [0, 0],
    offset: [0, 0],
    lastOffset: [0, 0],
    direction: [0, 0],
    initial: [0, 0],
    previous: [0, 0],
    first: false,
    last: false,
    active: false,
    timeStamp: 0,
    startTime: 0,
    elapsedTime: 0,
    cancel: noop,
    canceled: false,
    memo: void 0,
    args: void 0,
    ...mixed
  };
}
function getInitialState() {
  const shared = {
    hovering: false,
    scrolling: false,
    wheeling: false,
    dragging: false,
    moving: false,
    pinching: false,
    touches: 0,
    buttons: 0,
    down: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ctrlKey: false,
    locked: false
  };
  const drag = getInitial({
    _pointerId: void 0,
    axis: void 0,
    xy: [0, 0],
    vxvy: [0, 0],
    velocity: 0,
    distance: 0,
    tap: false,
    swipe: [0, 0]
  });
  const pinch = getInitial({
    // @ts-expect-error when used _pointerIds we can assert its type will be [number, number]
    _pointerIds: [],
    da: [0, 0],
    vdva: [0, 0],
    // @ts-expect-error origin can never be passed as undefined in userland
    origin: void 0,
    turns: 0
  });
  const wheel = getInitial({
    axis: void 0,
    xy: [0, 0],
    vxvy: [0, 0],
    velocity: 0,
    distance: 0
  });
  const move = getInitial({
    axis: void 0,
    xy: [0, 0],
    vxvy: [0, 0],
    velocity: 0,
    distance: 0
  });
  const scroll = getInitial({
    axis: void 0,
    xy: [0, 0],
    vxvy: [0, 0],
    velocity: 0,
    distance: 0
  });
  return { shared, drag, pinch, wheel, move, scroll };
}

var __defProp$6 = Object.defineProperty;
var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$6 = (obj, key, value) => {
  __defNormalProp$6(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Controller {
  constructor(classes) {
    this.classes = classes;
    __publicField$6(this, "nativeRefs");
    __publicField$6(this, "config");
    __publicField$6(this, "handlers");
    __publicField$6(this, "state");
    // state for all gestures
    __publicField$6(this, "timeouts");
    // tracks timeouts of debounced gestures
    __publicField$6(this, "domListeners");
    // when config.domTarget is set, we attach events directly to the dom
    __publicField$6(this, "windowListeners");
    // keeps track of window listeners added by gestures (drag only at the moment)
    __publicField$6(this, "pointerIds", /* @__PURE__ */ new Set());
    // register Pointer Events pointerIds
    __publicField$6(this, "touchIds", /* @__PURE__ */ new Set());
    // register Touch Events identifiers
    __publicField$6(this, "supportsTouchEvents", supportsTouchEvents());
    __publicField$6(this, "supportsGestureEvents", supportsGestureEvents());
    __publicField$6(this, "supportsPointerEvents", supportsPointerEvents());
    __publicField$6(this, "bind", (...args) => {
      const bindings = {};
      for (let RecognizerClass2 of this.classes)
        new RecognizerClass2(this, args).addBindings(bindings);
      for (let eventKey in this.nativeRefs) {
        addBindings(
          bindings,
          eventKey,
          (event) => this.nativeRefs[eventKey]({ ...this.state.shared, event, args })
        );
      }
      if (this.config.domTarget) {
        return updateDomListeners(this, bindings);
      } else {
        return getPropsListener(this, bindings);
      }
    });
    /**
     * Function ran on component unmount: cleans timeouts and removes dom listeners set by the bind function.
     */
    __publicField$6(this, "clean", () => {
      const { eventOptions, domTarget } = this.config;
      const _target = vueDemi.unref(domTarget);
      if (_target)
        removeListeners(_target, takeAll(this.domListeners), eventOptions);
      Object.values(this.timeouts).forEach(clearTimeout);
      clearAllWindowListeners(this);
    });
    /**
     * Resets state to the initial value.
     */
    __publicField$6(this, "reset", () => {
      this.state = getInitialState();
    });
    this.classes = classes;
    this.state = getInitialState();
    this.timeouts = {};
    this.domListeners = [];
    this.windowListeners = {};
  }
}
function addEventIds(controller, event) {
  if ("pointerId" in event) {
    controller.pointerIds.add(event.pointerId);
  } else {
    controller.touchIds = new Set(getTouchIds(event));
  }
}
function removeEventIds(controller, event) {
  if ("pointerId" in event) {
    controller.pointerIds.delete(event.pointerId);
  } else {
    getTouchIds(event).forEach((id) => controller.touchIds.delete(id));
  }
}
function clearAllWindowListeners(controller) {
  const {
    config: { window: el, eventOptions },
    windowListeners
  } = controller;
  const _el = vueDemi.unref(el);
  if (!_el)
    return;
  for (let stateKey in windowListeners) {
    const handlers = windowListeners[stateKey];
    removeListeners(_el, handlers, eventOptions);
  }
  controller.windowListeners = {};
}
function clearWindowListeners({ config, windowListeners }, stateKey, options = config.eventOptions) {
  const _window = vueDemi.unref(config.window);
  if (!_window)
    return;
  removeListeners(_window, windowListeners[stateKey], options);
  delete windowListeners[stateKey];
}
function updateWindowListeners({ config, windowListeners }, stateKey, listeners = [], options = config.eventOptions) {
  const _window = vueDemi.unref(config.window);
  if (!_window)
    return;
  removeListeners(_window, windowListeners[stateKey], options);
  addListeners(_window, windowListeners[stateKey] = listeners, options);
}
function updateDomListeners({ config, domListeners }, bindings) {
  const { eventOptions, domTarget } = config;
  const _target = vueDemi.unref(domTarget);
  if (!_target)
    throw new Error("domTarget must be defined");
  removeListeners(_target, takeAll(domListeners), eventOptions);
  for (let [key, fns] of Object.entries(bindings)) {
    const name = key.slice(2).toLowerCase();
    domListeners.push([name, chainFns(...fns)]);
  }
  addListeners(_target, domListeners, eventOptions);
}
function getPropsListener({ config }, bindings) {
  const props = {};
  const captureString = config.eventOptions.capture ? "Capture" : "";
  for (let [event, fns] of Object.entries(bindings)) {
    const fnsArray = Array.isArray(fns) ? fns : [fns];
    const key = event + captureString;
    props[key] = chainFns(...fnsArray);
  }
  return props;
}
function takeAll(array = []) {
  return array.splice(0, array.length);
}
function addBindings(bindings, name, fn) {
  if (!bindings[name])
    bindings[name] = [];
  bindings[name].push(fn);
}
function addListeners(el, listeners = [], options = {}) {
  if (!el)
    return;
  for (let [eventName, eventHandler] of listeners) {
    el.addEventListener(eventName, eventHandler, options);
  }
}
function removeListeners(el, listeners = [], options = {}) {
  if (!el)
    return;
  for (let [eventName, eventHandler] of listeners) {
    el.removeEventListener(eventName, eventHandler, options);
  }
}

function addV(v1, v2) {
  return v1.map((v, i) => v + v2[i]);
}
function subV(v1, v2) {
  return v1.map((v, i) => v - v2[i]);
}
function calculateDistance(movement) {
  return Math.hypot(...movement);
}
function calculateAllGeometry(movement, delta = movement) {
  const dl = calculateDistance(delta);
  const alpha = dl === 0 ? 0 : 1 / dl;
  const direction = delta.map((v) => alpha * v);
  const distance = calculateDistance(movement);
  return { distance, direction };
}
function calculateAllKinematics(movement, delta, dt) {
  const dl = calculateDistance(delta);
  const alpha = dl === 0 ? 0 : 1 / dl;
  const beta = dt === 0 ? 0 : 1 / dt;
  const velocity = beta * dl;
  const velocities = delta.map((v) => beta * v);
  const direction = delta.map((v) => alpha * v);
  const distance = calculateDistance(movement);
  return { velocities, velocity, distance, direction };
}
function sign(x) {
  if (Math.sign)
    return Math.sign(x);
  return Number(x > 0) - Number(x < 0) || +x;
}

function minMax(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
function rubberband2(distance, constant) {
  return Math.pow(distance, constant * 5);
}
function rubberband(distance, dimension, constant) {
  if (dimension === 0 || Math.abs(dimension) === Infinity)
    return rubberband2(distance, constant);
  return distance * dimension * constant / (dimension + constant * distance);
}
function rubberbandIfOutOfBounds(position, min, max, constant = 0.15) {
  if (constant === 0)
    return minMax(position, min, max);
  if (position < min)
    return -rubberband(min - position, max - min, constant) + min;
  if (position > max)
    return +rubberband(position - max, max - min, constant) + max;
  return position;
}

var __defProp$5 = Object.defineProperty;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$5 = (obj, key, value) => {
  __defNormalProp$5(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const RecognizersMap = /* @__PURE__ */ new Map();
const identity = (xy) => xy;
class Recognizer {
  /**
   * Creates an instance of a gesture recognizer.
   * @param stateKey drag, move, pinch, etc.
   * @param controller the controller attached to the gesture
   * @param [args] the args that should be passed to the gesture handler
   */
  constructor(controller, args = []) {
    this.controller = controller;
    this.args = args;
    // dragging, scrolling, etc.
    __publicField$5(this, "debounced", true);
    // Convenience method to set a timeout for a given gesture
    __publicField$5(this, "setTimeout", (callback, ms = 140, ...args) => {
      clearTimeout(this.controller.timeouts[this.stateKey]);
      this.controller.timeouts[this.stateKey] = window.setTimeout(
        callback,
        ms,
        ...args
      );
    });
    // Convenience method to clear a timeout for a given gesture
    __publicField$5(this, "clearTimeout", () => {
      clearTimeout(this.controller.timeouts[this.stateKey]);
    });
    /**
     * Fires the gesture handler
     */
    __publicField$5(this, "fireGestureHandler", (forceFlag = false) => {
      if (this.state._blocked) {
        if (!this.debounced) {
          this.state._active = false;
          this.clean();
        }
        return null;
      }
      if (!forceFlag && !this.state.intentional && !this.config.triggerAllEvents)
        return null;
      if (this.state.intentional) {
        const prev_active = this.state.active;
        const next_active = this.state._active;
        this.state.active = next_active;
        this.state.first = next_active && !prev_active;
        this.state.last = prev_active && !next_active;
        this.controller.state.shared[this.ingKey] = next_active;
      }
      const touches = this.controller.pointerIds.size || this.controller.touchIds.size;
      const down = this.controller.state.shared.buttons > 0 || touches > 0;
      const state = {
        ...this.controller.state.shared,
        ...this.state,
        ...this.mapStateValues(this.state),
        // Sets xy or da to the gesture state values
        locked: !!document.pointerLockElement,
        touches,
        down
      };
      const newMemo = this.handler(state);
      this.state.memo = newMemo !== void 0 ? newMemo : this.state.memo;
      return state;
    });
    this.controller = controller;
    this.args = args;
  }
  // Returns the gesture config
  get config() {
    return this.controller.config[this.stateKey];
  }
  // Is the gesture enabled
  get enabled() {
    return this.controller.config.enabled && this.config.enabled;
  }
  // Returns the controller state for a given gesture
  get state() {
    return this.controller.state[this.stateKey];
  }
  // Returns the gesture handler
  get handler() {
    return this.controller.handlers[this.stateKey];
  }
  get transform() {
    return this.config.transform || this.controller.config.transform || identity;
  }
  // Convenience method to update the shared state
  updateSharedState(sharedState) {
    Object.assign(this.controller.state.shared, sharedState);
  }
  // Convenience method to update the gesture state
  updateGestureState(gestureState) {
    Object.assign(this.state, gestureState);
  }
  /**
   * Returns state properties depending on the movement and state.
   *
   * Should be overriden for custom behavior, doesn't do anything in the implementation
   * below.
   */
  checkIntentionality(_intentional, _movement) {
    return { _intentional, _blocked: false };
  }
  /**
   * Returns basic movement properties for the gesture based on the next values and current state.
   */
  getMovement(values) {
    const { rubberband, threshold: T } = this.config;
    const {
      _bounds,
      _initial,
      _active,
      _intentional: wasIntentional,
      lastOffset,
      movement: prevMovement
    } = this.state;
    const M = this.getInternalMovement(values, this.state);
    const _T = this.transform(T).map(Math.abs);
    const i0 = wasIntentional[0] === false ? getIntentionalDisplacement(M[0], _T[0]) : wasIntentional[0];
    const i1 = wasIntentional[1] === false ? getIntentionalDisplacement(M[1], _T[1]) : wasIntentional[1];
    const intentionalityCheck = this.checkIntentionality([i0, i1], M);
    if (intentionalityCheck._blocked) {
      return { ...intentionalityCheck, _movement: M, delta: [0, 0] };
    }
    const _intentional = intentionalityCheck._intentional;
    const _movement = M;
    let movement = [
      _intentional[0] !== false ? M[0] - _intentional[0] : 0,
      _intentional[1] !== false ? M[1] - _intentional[1] : 0
    ];
    const offset = addV(movement, lastOffset);
    const _rubberband = _active ? rubberband : [0, 0];
    movement = computeRubberband(_bounds, addV(movement, _initial), _rubberband);
    return {
      ...intentionalityCheck,
      intentional: _intentional[0] !== false || _intentional[1] !== false,
      _initial,
      _movement,
      movement,
      values,
      offset: computeRubberband(_bounds, offset, _rubberband),
      delta: subV(movement, prevMovement)
    };
  }
  // Cleans the gesture. Can be overriden by gestures.
  clean() {
    this.clearTimeout();
  }
}
function getIntentionalDisplacement(movement, threshold) {
  if (Math.abs(movement) >= threshold) {
    return sign(movement) * threshold;
  } else {
    return false;
  }
}
function computeRubberband(bounds, [Vx, Vy], [Rx, Ry]) {
  const [[X1, X2], [Y1, Y2]] = bounds;
  return [
    rubberbandIfOutOfBounds(Vx, X1, X2, Rx),
    rubberbandIfOutOfBounds(Vy, Y1, Y2, Ry)
  ];
}
function getGenericPayload({ state }, event, isStartEvent) {
  const { timeStamp, type: _lastEventType } = event;
  const previous = state.values;
  const elapsedTime = isStartEvent ? 0 : timeStamp - state.startTime;
  return { _lastEventType, event, timeStamp, elapsedTime, previous };
}
function getStartGestureState({ state, config, stateKey, args }, values, event) {
  const offset = state.offset;
  const startTime = event.timeStamp;
  const { initial, bounds } = config;
  const _state = {
    ...getInitialState()[stateKey],
    _active: true,
    args,
    values,
    initial: values,
    offset,
    lastOffset: offset,
    startTime
  };
  return {
    ..._state,
    _initial: valueFn(initial, _state),
    _bounds: valueFn(bounds, _state)
  };
}

class CoordinatesRecognizer extends Recognizer {
  /**
   * Returns the real movement (without taking intentionality into account)
   */
  getInternalMovement(values, state) {
    return subV(values, state.initial);
  }
  /**
   * In coordinates-based gesture, this function will detect the first intentional axis,
   * lock the gesture axis if lockDirection is specified in the config, block the gesture
   * if the first intentional axis doesn't match the specified axis in config.
   */
  checkIntentionality(_intentional, _movement) {
    if (_intentional[0] === false && _intentional[1] === false) {
      return { _intentional, axis: this.state.axis };
    }
    const [absX, absY] = _movement.map(Math.abs);
    const axis = this.state.axis || (absX > absY ? "x" : absX < absY ? "y" : void 0);
    if (!this.config.axis && !this.config.lockDirection)
      return { _intentional, _blocked: false, axis };
    if (!axis)
      return { _intentional: [false, false], _blocked: false, axis };
    if (!!this.config.axis && axis !== this.config.axis)
      return { _intentional, _blocked: true, axis };
    _intentional[axis === "x" ? 1 : 0] = false;
    return { _intentional, _blocked: false, axis };
  }
  getKinematics(values, event) {
    const state = this.getMovement(values);
    if (!state._blocked) {
      const dt = event.timeStamp - this.state.timeStamp;
      Object.assign(
        state,
        calculateAllKinematics(state.movement, state.delta, dt)
      );
    }
    return state;
  }
  mapStateValues(state) {
    return { xy: state.values, vxvy: state.velocities };
  }
}

var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$4 = (obj, key, value) => {
  __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const TAP_DISTANCE_THRESHOLD = 3;
function persistEvent(event) {
  "persist" in event && typeof event.persist === "function" && event.persist();
}
class DragRecognizer extends CoordinatesRecognizer {
  constructor() {
    super(...arguments);
    __publicField$4(this, "ingKey", "dragging");
    __publicField$4(this, "stateKey", "drag");
    // TODO: add back when setPointerCapture is widely supported
    // https://caniuse.com/#search=setPointerCapture
    __publicField$4(this, "setPointerCapture", (event) => {
      if (this.config.useTouch || document.pointerLockElement)
        return;
      const { target, pointerId } = event;
      if (target && "setPointerCapture" in target) {
        target.setPointerCapture(pointerId);
      }
      this.updateGestureState({
        _dragTarget: target,
        _dragPointerId: pointerId
      });
    });
    __publicField$4(this, "releasePointerCapture", () => {
      if (this.config.useTouch || document.pointerLockElement)
        return;
      const { _dragTarget, _dragPointerId } = this.state;
      if (_dragPointerId && _dragTarget && "releasePointerCapture" in _dragTarget) {
        if (!("hasPointerCapture" in _dragTarget) || _dragTarget.hasPointerCapture(_dragPointerId))
          try {
            _dragTarget.releasePointerCapture(_dragPointerId);
          } catch (e) {
          }
      }
    });
    __publicField$4(this, "preventScroll", (event) => {
      if (this.state._dragPreventScroll && event.cancelable) {
        event.preventDefault();
      }
    });
    __publicField$4(this, "getEventId", (event) => {
      if (this.config.useTouch)
        return event.changedTouches[0].identifier;
      return event.pointerId;
    });
    __publicField$4(this, "isValidEvent", (event) => {
      return this.state._pointerId === this.getEventId(event);
    });
    __publicField$4(this, "shouldPreventWindowScrollY", this.config.preventWindowScrollY && this.controller.supportsTouchEvents);
    __publicField$4(this, "setUpWindowScrollDetection", (event) => {
      persistEvent(event);
      updateWindowListeners(
        this.controller,
        this.stateKey,
        [
          ["touchmove", this.preventScroll],
          ["touchend", this.clean.bind(this)],
          ["touchcancel", this.clean.bind(this)]
        ],
        { passive: false }
      );
      this.setTimeout(this.startDrag.bind(this), 250, event);
    });
    __publicField$4(this, "setUpDelayedDragTrigger", (event) => {
      this.state._dragDelayed = true;
      persistEvent(event);
      this.setTimeout(this.startDrag.bind(this), this.config.delay, event);
    });
    __publicField$4(this, "setStartState", (event) => {
      const values = getPointerEventValues(event, this.transform);
      this.updateSharedState(getGenericEventData(event));
      this.updateGestureState({
        ...getStartGestureState(this, values, event),
        ...getGenericPayload(this, event, true),
        _pointerId: this.getEventId(event)
        // setting pointerId locks the gesture to this specific event
      });
      this.updateGestureState(this.getMovement(values));
    });
    __publicField$4(this, "onDragStart", (event) => {
      addEventIds(this.controller, event);
      if (!this.enabled || this.state._active)
        return;
      this.setStartState(event);
      this.setPointerCapture(event);
      if (this.shouldPreventWindowScrollY)
        this.setUpWindowScrollDetection(event);
      else if (this.config.delay > 0)
        this.setUpDelayedDragTrigger(event);
      else
        this.startDrag(event, true);
    });
    __publicField$4(this, "onDragChange", (event) => {
      if (
        // if the gesture was canceled or
        this.state.canceled || // if onDragStart wasn't fired or
        !this.state._active || // if the event pointerId doesn't match the one that initiated the drag
        !this.isValidEvent(event) || // if the event has the same timestamp as the previous event
        // note that checking type equality is ONLY for tests ¯\_(ツ)_/¯
        this.state._lastEventType === event.type && event.timeStamp === this.state.timeStamp
      )
        return;
      let values;
      if (document.pointerLockElement) {
        const { movementX, movementY } = event;
        values = addV(this.transform([movementX, movementY]), this.state.values);
      } else
        values = getPointerEventValues(event, this.transform);
      const kinematics = this.getKinematics(values, event);
      if (!this.state._dragStarted) {
        if (this.state._dragDelayed) {
          this.startDrag(event);
          return;
        }
        if (this.shouldPreventWindowScrollY) {
          if (!this.state._dragPreventScroll && kinematics.axis) {
            if (kinematics.axis === "x") {
              this.startDrag(event);
            } else {
              this.state._active = false;
              return;
            }
          } else
            return;
        } else
          return;
      }
      const genericEventData = getGenericEventData(event);
      this.updateSharedState(genericEventData);
      const genericPayload = getGenericPayload(this, event);
      const realDistance = calculateDistance(kinematics._movement);
      let { _dragIsTap } = this.state;
      if (_dragIsTap && realDistance >= TAP_DISTANCE_THRESHOLD)
        _dragIsTap = false;
      this.updateGestureState({ ...genericPayload, ...kinematics, _dragIsTap });
      this.fireGestureHandler();
    });
    __publicField$4(this, "onDragEnd", (event) => {
      removeEventIds(this.controller, event);
      if (!this.isValidEvent(event))
        return;
      this.clean();
      if (!this.state._active)
        return;
      this.state._active = false;
      const tap = this.state._dragIsTap;
      const [vx, vy] = this.state.velocities;
      const [mx, my] = this.state.movement;
      const [ix, iy] = this.state._intentional;
      const [svx, svy] = this.config.swipeVelocity;
      const [sx, sy] = this.config.swipeDistance;
      const sd = this.config.swipeDuration;
      const endState = {
        ...getGenericPayload(this, event),
        ...this.getMovement(this.state.values)
      };
      const swipe = [0, 0];
      if (endState.elapsedTime < sd) {
        if (ix !== false && Math.abs(vx) > svx && Math.abs(mx) > sx)
          swipe[0] = sign(vx);
        if (iy !== false && Math.abs(vy) > svy && Math.abs(my) > sy)
          swipe[1] = sign(vy);
      }
      this.updateSharedState({ buttons: 0 });
      this.updateGestureState({ ...endState, tap, swipe });
      this.fireGestureHandler(this.config.filterTaps && tap === true);
    });
    __publicField$4(this, "clean", () => {
      super.clean();
      this.state._dragStarted = false;
      this.releasePointerCapture();
      clearWindowListeners(this.controller, this.stateKey);
    });
    __publicField$4(this, "onCancel", () => {
      if (this.state.canceled)
        return;
      this.updateGestureState({ canceled: true, _active: false });
      this.updateSharedState({ buttons: 0 });
      vueDemi.nextTick(this.fireGestureHandler);
    });
    __publicField$4(this, "onClick", (event) => {
      if (!this.state._dragIsTap)
        event.stopPropagation();
    });
  }
  startDrag(event, onDragIsStart = false) {
    if (
      // if the gesture isn't active (probably means)
      !this.state._active || // if the drag has already started we should ignore subsequent attempts
      this.state._dragStarted
    )
      return;
    if (!onDragIsStart)
      this.setStartState(event);
    this.updateGestureState({
      _dragStarted: true,
      _dragPreventScroll: true,
      cancel: this.onCancel
    });
    this.clearTimeout();
    this.fireGestureHandler();
  }
  addBindings(bindings) {
    if (this.config.useTouch) {
      addBindings(bindings, "onTouchStart", this.onDragStart);
      addBindings(bindings, "onTouchMove", this.onDragChange);
      addBindings(bindings, "onTouchEnd", this.onDragEnd);
      addBindings(bindings, "onTouchCancel", this.onDragEnd);
    } else {
      addBindings(bindings, "onPointerDown", this.onDragStart);
      addBindings(bindings, "onPointerMove", this.onDragChange);
      addBindings(bindings, "onPointerUp", this.onDragEnd);
      addBindings(bindings, "onPointerCancel", this.onDragEnd);
    }
    if (this.config.filterTaps) {
      const handler = this.controller.config.eventOptions.capture ? "onClick" : "onClickCapture";
      addBindings(bindings, handler, this.onClick);
    }
  }
}

function memoizeOne(resultFn, isEqual) {
  let lastThis;
  let lastArgs = [];
  let lastResult;
  let calledOnce = false;
  function memoized(...newArgs) {
    if (calledOnce && lastThis === this && isEqual(newArgs, lastArgs)) {
      return lastResult;
    }
    lastResult = resultFn.apply(this, newArgs);
    calledOnce = true;
    lastThis = this;
    lastArgs = newArgs;
    return lastResult;
  }
  return memoized;
}

function equal(a, b) {
  if (a === b)
    return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor)
      return false;
    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length)
        return false;
      for (i = length; i-- !== 0; )
        if (!equal(a[i], b[i]))
          return false;
      return true;
    }
    let it;
    if (typeof Map === "function" && a instanceof Map && b instanceof Map) {
      if (a.size !== b.size)
        return false;
      it = a.entries();
      while (!(i = it.next()).done)
        if (!b.has(i.value[0]))
          return false;
      it = a.entries();
      while (!(i = it.next()).done)
        if (!equal(i.value[1], b.get(i.value[0])))
          return false;
      return true;
    }
    if (typeof Set === "function" && a instanceof Set && b instanceof Set) {
      if (a.size !== b.size)
        return false;
      it = a.entries();
      while (!(i = it.next()).done)
        if (!b.has(i.value[0]))
          return false;
      return true;
    }
    if (a.constructor === RegExp)
      return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString)
      return a.toString() === b.toString();
    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length)
      return false;
    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
        return false;
    if (typeof Element !== "undefined" && a instanceof Element)
      return false;
    for (i = length; i-- !== 0; ) {
      if (keys[i] === "_owner" && a.$$typeof)
        continue;
      if (!equal(a[keys[i]], b[keys[i]]))
        return false;
    }
    return true;
  }
  return a !== a && b !== b;
}
function isEqual(a, b) {
  try {
    return equal(a, b);
  } catch (error) {
    if ((error.message || "").match(/stack|recursion/i)) {
      console.warn("react-fast-compare cannot handle circular refs");
      return false;
    }
    throw error;
  }
}

function resolveWith(config = {}, resolvers) {
  const result = {};
  for (const [key, resolver] of Object.entries(resolvers))
    switch (typeof resolver) {
      case "function":
        result[key] = resolver.call(result, config[key], key, config);
        break;
      case "object":
        result[key] = resolveWith(config[key], resolver);
        break;
      case "boolean":
        if (resolver)
          result[key] = config[key];
        break;
    }
  return result;
}

const DEFAULT_DRAG_DELAY = 180;
const DEFAULT_RUBBERBAND = 0.15;
const DEFAULT_SWIPE_VELOCITY = 0.5;
const DEFAULT_SWIPE_DISTANCE = 50;
const DEFAULT_SWIPE_DURATION = 250;
const InternalGestureOptionsNormalizers = {
  threshold(value = 0) {
    return ensureVector(value);
  },
  rubberband(value = 0) {
    switch (value) {
      case true:
        return ensureVector(DEFAULT_RUBBERBAND);
      case false:
        return ensureVector(0);
      default:
        return ensureVector(value);
    }
  },
  enabled(value = true) {
    return value;
  },
  triggerAllEvents(value = false) {
    return value;
  },
  initial(value = 0) {
    if (typeof value === "function")
      return value;
    return ensureVector(value);
  },
  transform: true
};
const InternalCoordinatesOptionsNormalizers = {
  ...InternalGestureOptionsNormalizers,
  axis: true,
  lockDirection(value = false) {
    return value;
  },
  bounds(value = {}) {
    if (typeof value === "function")
      return (state) => InternalCoordinatesOptionsNormalizers.bounds(value(state));
    const {
      left = -Infinity,
      right = Infinity,
      top = -Infinity,
      bottom = Infinity
    } = value;
    return [
      [left, right],
      [top, bottom]
    ];
  }
};
const isBrowser = typeof window !== "undefined" && window.document && window.document.createElement;
const InternalGenericOptionsNormalizers = {
  enabled(value = true) {
    return value;
  },
  domTarget: true,
  window(value = isBrowser ? window : void 0) {
    return value;
  },
  eventOptions({ passive = true, capture = false } = {}) {
    return { passive, capture };
  },
  transform: true
};
const InternalDistanceAngleOptionsNormalizers = {
  ...InternalGestureOptionsNormalizers,
  bounds(_value, _key, { distanceBounds = {}, angleBounds = {} }) {
    const _distanceBounds = (state) => {
      const D = assignDefault(valueFn(distanceBounds, state), {
        min: -Infinity,
        max: Infinity
      });
      return [D.min, D.max];
    };
    const _angleBounds = (state) => {
      const A = assignDefault(valueFn(angleBounds, state), {
        min: -Infinity,
        max: Infinity
      });
      return [A.min, A.max];
    };
    if (typeof distanceBounds !== "function" && typeof angleBounds !== "function")
      return [_distanceBounds(), _angleBounds()];
    return (state) => [_distanceBounds(state), _angleBounds(state)];
  }
};
const InternalDragOptionsNormalizers = {
  ...InternalCoordinatesOptionsNormalizers,
  useTouch(value = true) {
    return value && supportsTouchEvents();
  },
  preventWindowScrollY(value = false) {
    return value;
  },
  threshold(v, _k, { filterTaps = false, lockDirection = false, axis = void 0 }) {
    const A = ensureVector(
      v,
      filterTaps ? 3 : lockDirection ? 1 : axis ? 1 : 0
    );
    this.filterTaps = filterTaps;
    return A;
  },
  swipeVelocity(v = DEFAULT_SWIPE_VELOCITY) {
    return ensureVector(v);
  },
  swipeDistance(v = DEFAULT_SWIPE_DISTANCE) {
    return ensureVector(v);
  },
  swipeDuration(value = DEFAULT_SWIPE_DURATION) {
    return value;
  },
  delay(value = 0) {
    switch (value) {
      case true:
        return DEFAULT_DRAG_DELAY;
      case false:
        return 0;
      default:
        return value;
    }
  }
};
function getInternalGenericOptions(config) {
  return resolveWith(
    config,
    InternalGenericOptionsNormalizers
  );
}
function getInternalCoordinatesOptions(config = {}) {
  return resolveWith(
    config,
    InternalCoordinatesOptionsNormalizers
  );
}
function getInternalDistanceAngleOptions(config = {}) {
  return resolveWith(
    config,
    InternalDistanceAngleOptionsNormalizers
  );
}
function getInternalDragOptions(config = {}) {
  return resolveWith(
    config,
    InternalDragOptionsNormalizers
  );
}

function _buildMoveConfig({
  domTarget,
  eventOptions,
  window,
  enabled,
  ...rest
}) {
  const opts = getInternalGenericOptions({
    domTarget,
    eventOptions,
    window,
    enabled
  });
  opts.move = getInternalCoordinatesOptions(rest);
  return opts;
}
function _buildHoverConfig({
  domTarget,
  eventOptions,
  window,
  enabled,
  ...rest
}) {
  const opts = getInternalGenericOptions({
    domTarget,
    eventOptions,
    window,
    enabled
  });
  opts.hover = { enabled: true, ...rest };
  return opts;
}
function _buildDragConfig({
  domTarget,
  eventOptions,
  window,
  enabled,
  ...rest
}) {
  const opts = getInternalGenericOptions({
    domTarget,
    eventOptions,
    window,
    enabled
  });
  opts.drag = getInternalDragOptions(rest);
  return opts;
}
function _buildPinchConfig({
  domTarget,
  eventOptions,
  window,
  enabled,
  ...rest
}) {
  const opts = getInternalGenericOptions({
    domTarget,
    eventOptions,
    window,
    enabled
  });
  opts.pinch = getInternalDistanceAngleOptions(rest);
  return opts;
}
function _buildScrollConfig({
  domTarget,
  eventOptions,
  window,
  enabled,
  ...rest
}) {
  const opts = getInternalGenericOptions({
    domTarget,
    eventOptions,
    window,
    enabled
  });
  opts.scroll = getInternalCoordinatesOptions(rest);
  return opts;
}
function _buildWheelConfig({
  domTarget,
  eventOptions,
  window,
  enabled,
  ...rest
}) {
  const opts = getInternalGenericOptions({
    domTarget,
    eventOptions,
    window,
    enabled
  });
  opts.wheel = getInternalCoordinatesOptions(rest);
  return opts;
}
function buildComplexConfig(config, actions = /* @__PURE__ */ new Set()) {
  const {
    drag,
    wheel,
    move,
    scroll,
    pinch,
    hover,
    eventOptions,
    window,
    transform,
    domTarget,
    enabled
  } = config;
  const mergedConfig = getInternalGenericOptions({
    domTarget,
    eventOptions,
    transform,
    window,
    enabled
  });
  if (actions.has("onDrag"))
    mergedConfig.drag = getInternalDragOptions(drag);
  if (actions.has("onWheel"))
    mergedConfig.wheel = getInternalCoordinatesOptions(wheel);
  if (actions.has("onScroll"))
    mergedConfig.scroll = getInternalCoordinatesOptions(scroll);
  if (actions.has("onMove"))
    mergedConfig.move = getInternalCoordinatesOptions(move);
  if (actions.has("onPinch"))
    mergedConfig.pinch = getInternalDistanceAngleOptions(pinch);
  if (actions.has("onHover"))
    mergedConfig.hover = { enabled: true, ...hover };
  return mergedConfig;
}

function useRecognizers(handlers, config, nativeHandlers = {}) {
  const classes = resolveClasses(handlers);
  const controller = new Controller(classes);
  controller.config = config;
  controller.handlers = handlers;
  controller.nativeRefs = nativeHandlers;
  if (vueDemi.getCurrentInstance() && !config.manual) {
    vueDemi.onMounted(controller.bind);
    vueDemi.onUnmounted(controller.clean);
  }
  return controller;
}
function resolveClasses(internalHandlers) {
  const classes = /* @__PURE__ */ new Set();
  if (internalHandlers.drag)
    classes.add(RecognizersMap.get("drag"));
  if (internalHandlers.wheel)
    classes.add(RecognizersMap.get("wheel"));
  if (internalHandlers.scroll)
    classes.add(RecognizersMap.get("scroll"));
  if (internalHandlers.move)
    classes.add(RecognizersMap.get("move"));
  if (internalHandlers.pinch)
    classes.add(RecognizersMap.get("pinch"));
  if (internalHandlers.hover)
    classes.add(RecognizersMap.get("hover"));
  return classes;
}

function useDrag(handler, config = {}) {
  RecognizersMap.set("drag", DragRecognizer);
  const buildDragConfig = vueDemi.ref();
  if (!buildDragConfig.value) {
    buildDragConfig.value = memoizeOne(_buildDragConfig, isEqual);
  }
  return useRecognizers({ drag: handler }, buildDragConfig.value(config));
}

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => {
  __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class MoveRecognizer extends CoordinatesRecognizer {
  constructor() {
    super(...arguments);
    __publicField$3(this, "ingKey", "moving");
    __publicField$3(this, "stateKey", "move");
    __publicField$3(this, "debounced", true);
    __publicField$3(this, "onMove", (event) => {
      if (!this.enabled)
        return;
      this.setTimeout(this.onMoveEnd);
      if (!this.state._active)
        this.onMoveStart(event);
      else
        this.onMoveChange(event);
    });
    __publicField$3(this, "onMoveStart", (event) => {
      this.updateSharedState(getGenericEventData(event));
      const values = getPointerEventValues(event, this.transform);
      this.updateGestureState({
        ...getStartGestureState(this, values, event),
        ...getGenericPayload(this, event, true)
      });
      this.updateGestureState(this.getMovement(values));
      this.fireGestureHandler();
    });
    __publicField$3(this, "onMoveChange", (event) => {
      this.updateSharedState(getGenericEventData(event));
      const values = getPointerEventValues(event, this.transform);
      this.updateGestureState({
        ...getGenericPayload(this, event),
        ...this.getKinematics(values, event)
      });
      this.fireGestureHandler();
    });
    __publicField$3(this, "onMoveEnd", () => {
      this.clean();
      if (!this.state._active)
        return;
      const values = this.state.values;
      this.updateGestureState(this.getMovement(values));
      this.updateGestureState({ velocities: [0, 0], velocity: 0, _active: false });
      this.fireGestureHandler();
    });
    __publicField$3(this, "hoverTransform", () => {
      return this.controller.config.hover.transform || this.controller.config.transform;
    });
    __publicField$3(this, "onPointerEnter", (event) => {
      this.controller.state.shared.hovering = true;
      if (!this.controller.config.enabled)
        return;
      if (this.controller.config.hover.enabled) {
        const values = getPointerEventValues(event, this.hoverTransform());
        const state = {
          ...this.controller.state.shared,
          ...this.state,
          ...getGenericPayload(this, event, true),
          args: this.args,
          values,
          active: true,
          hovering: true
        };
        this.controller.handlers.hover({
          ...state,
          ...this.mapStateValues(state)
        });
      }
      if ("move" in this.controller.handlers)
        this.onMoveStart(event);
    });
    __publicField$3(this, "onPointerLeave", (event) => {
      this.controller.state.shared.hovering = false;
      if ("move" in this.controller.handlers)
        this.onMoveEnd();
      if (!this.controller.config.hover.enabled)
        return;
      const values = getPointerEventValues(event, this.hoverTransform());
      const state = {
        ...this.controller.state.shared,
        ...this.state,
        ...getGenericPayload(this, event),
        args: this.args,
        values,
        active: false
      };
      this.controller.handlers.hover({ ...state, ...this.mapStateValues(state) });
    });
  }
  addBindings(bindings) {
    if ("move" in this.controller.handlers) {
      addBindings(bindings, "onPointerMove", this.onMove);
    }
    if ("hover" in this.controller.handlers) {
      addBindings(bindings, "onPointerEnter", this.onPointerEnter);
      addBindings(bindings, "onPointerLeave", this.onPointerLeave);
    }
  }
}

class DistanceAngleRecognizer extends Recognizer {
  getInternalMovement(values, state) {
    const prev_a = state.values[1];
    let [d, a = prev_a] = values;
    let delta_a = a - prev_a;
    let next_turns = state.turns;
    if (Math.abs(delta_a) > 270)
      next_turns += sign(delta_a);
    return subV([d, a - 360 * next_turns], state.initial);
  }
  getKinematics(values, event) {
    const state = this.getMovement(values);
    const turns = (values[1] - state._movement[1] - this.state.initial[1]) / 360;
    const dt = event.timeStamp - this.state.timeStamp;
    const { distance, velocity, ...kinematics } = calculateAllKinematics(
      state.movement,
      state.delta,
      dt
    );
    return { turns, ...state, ...kinematics };
  }
  mapStateValues(state) {
    return { da: state.values, vdva: state.velocities };
  }
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => {
  __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const ZOOM_CONSTANT = 7;
const WEBKIT_DISTANCE_SCALE_FACTOR = 260;
class PinchRecognizer extends DistanceAngleRecognizer {
  constructor() {
    super(...arguments);
    __publicField$2(this, "ingKey", "pinching");
    __publicField$2(this, "stateKey", "pinch");
    __publicField$2(this, "onPinchStart", (event) => {
      addEventIds(this.controller, event);
      const touchIds = this.controller.touchIds;
      if (!this.enabled)
        return;
      if (this.state._active) {
        if (this.state._pointerIds.every((id) => touchIds.has(id)))
          return;
      }
      if (touchIds.size < 2)
        return;
      const _pointerIds = Array.from(touchIds).slice(0, 2);
      const { values, origin } = getTwoTouchesEventValues(
        event,
        _pointerIds,
        this.transform
      );
      this.updateSharedState(getGenericEventData(event));
      this.updateGestureState({
        ...getStartGestureState(this, values, event),
        ...getGenericPayload(this, event, true),
        _pointerIds,
        cancel: this.onCancel,
        origin
      });
      this.updateGestureState(this.getMovement(values));
      this.fireGestureHandler();
    });
    __publicField$2(this, "onPinchChange", (event) => {
      const { canceled, _active } = this.state;
      if (canceled || !_active || // if the event has the same timestamp as the previous event
      event.timeStamp === this.state.timeStamp)
        return;
      const genericEventData = getGenericEventData(event);
      this.updateSharedState(genericEventData);
      try {
        const { values, origin } = getTwoTouchesEventValues(
          event,
          this.state._pointerIds,
          this.transform
        );
        const kinematics = this.getKinematics(values, event);
        this.updateGestureState({
          ...getGenericPayload(this, event),
          ...kinematics,
          origin
        });
        this.fireGestureHandler();
      } catch (e) {
        this.onPinchEnd(event);
      }
    });
    __publicField$2(this, "onPinchEnd", (event) => {
      removeEventIds(this.controller, event);
      const pointerIds = getTouchIds(event);
      if (this.state._pointerIds.every((id) => !pointerIds.includes(id)))
        return;
      this.clean();
      if (!this.state._active)
        return;
      this.updateGestureState({
        ...getGenericPayload(this, event),
        ...this.getMovement(this.state.values),
        _active: false
      });
      this.fireGestureHandler();
    });
    __publicField$2(this, "onCancel", () => {
      if (this.state.canceled)
        return;
      this.updateGestureState({ _active: false, canceled: true });
      this.fireGestureHandler();
    });
    /**
     * PINCH WITH WEBKIT GESTURES
     */
    __publicField$2(this, "onGestureStart", (event) => {
      if (!this.enabled)
        return;
      event.preventDefault();
      const values = getWebkitGestureEventValues(event, this.transform);
      this.updateSharedState(getGenericEventData(event));
      this.updateGestureState({
        ...getStartGestureState(this, values, event),
        ...getGenericPayload(this, event, true),
        origin: [event.clientX, event.clientY],
        // only used on dekstop
        cancel: this.onCancel
      });
      this.updateGestureState(this.getMovement(values));
      this.fireGestureHandler();
    });
    __publicField$2(this, "onGestureChange", (event) => {
      const { canceled, _active } = this.state;
      if (canceled || !_active)
        return;
      event.preventDefault();
      const genericEventData = getGenericEventData(event);
      this.updateSharedState(genericEventData);
      const values = getWebkitGestureEventValues(event, this.transform);
      values[0] = (values[0] - this.state.event.scale) * WEBKIT_DISTANCE_SCALE_FACTOR + this.state.values[0];
      const kinematics = this.getKinematics(values, event);
      this.updateGestureState({
        ...getGenericPayload(this, event),
        ...kinematics,
        origin: [event.clientX, event.clientY]
        // only used on dekstop
      });
      this.fireGestureHandler();
    });
    __publicField$2(this, "onGestureEnd", (event) => {
      this.clean();
      if (!this.state._active)
        return;
      this.updateGestureState({
        ...getGenericPayload(this, event),
        ...this.getMovement(this.state.values),
        _active: false,
        origin: [event.clientX, event.clientY]
        // only used on dekstop
      });
      this.fireGestureHandler();
    });
    /**
     * PINCH WITH WHEEL
     */
    __publicField$2(this, "wheelShouldRun", (event) => {
      return this.enabled && event.ctrlKey;
    });
    __publicField$2(this, "getWheelValuesFromEvent", (event) => {
      const [, delta_d] = getWheelEventValues(event, this.transform);
      const {
        values: [prev_d, prev_a]
      } = this.state;
      const d = prev_d - delta_d * ZOOM_CONSTANT;
      const a = prev_a !== void 0 ? prev_a : 0;
      return {
        values: [d, a],
        origin: [event.clientX, event.clientY],
        delta: [0, delta_d]
      };
    });
    __publicField$2(this, "onWheel", (event) => {
      if (!this.wheelShouldRun(event))
        return;
      this.setTimeout(this.onWheelEnd);
      if (!this.state._active)
        this.onWheelStart(event);
      else
        this.onWheelChange(event);
    });
    __publicField$2(this, "onWheelStart", (event) => {
      const { values, delta, origin } = this.getWheelValuesFromEvent(event);
      if (event.cancelable)
        event.preventDefault();
      else if (process.env.NODE_ENV === "development") {
        console.warn(
          "To properly support zoom on trackpads, try using the `domTarget` option and `config.eventOptions.passive` set to `false`. This message will only appear in development mode."
        );
      }
      this.updateSharedState(getGenericEventData(event));
      this.updateGestureState({
        ...getStartGestureState(this, values, event),
        ...getGenericPayload(this, event, true),
        initial: this.state.values,
        offset: values,
        delta,
        origin
      });
      this.updateGestureState(this.getMovement(values));
      this.fireGestureHandler();
    });
    __publicField$2(this, "onWheelChange", (event) => {
      if (event.cancelable)
        event.preventDefault();
      this.updateSharedState(getGenericEventData(event));
      const { values, origin, delta } = this.getWheelValuesFromEvent(event);
      this.updateGestureState({
        ...getGenericPayload(this, event),
        ...this.getKinematics(values, event),
        origin,
        delta
      });
      this.fireGestureHandler();
    });
    __publicField$2(this, "onWheelEnd", () => {
      this.clean();
      if (!this.state._active)
        return;
      this.state._active = false;
      this.updateGestureState(this.getMovement(this.state.values));
      this.fireGestureHandler();
    });
    /*
     * PATCH for supports pointer events
     */
    // All currently active pointers
    __publicField$2(this, "activePointers", /* @__PURE__ */ new Map());
    // The two pointers that actually drive this pinch gesture
    __publicField$2(this, "gesturePointerIds", null);
    // Pointer-based start
    __publicField$2(this, "onPointerDown", (event) => {
      if (!this.enabled)
        return;
      if (event.pointerType === "mouse")
        return;
      this.activePointers.set(event.pointerId, event);
      if (this.state._active && this.gesturePointerIds) {
        return;
      }
      if (this.activePointers.size < 2)
        return;
      const pointerIds = Array.from(this.activePointers.keys()).slice(0, 2);
      const data = this.getPointerValues(pointerIds);
      if (!data)
        return;
      const { values, origin } = data;
      this.gesturePointerIds = pointerIds;
      this.updateSharedState(getGenericEventData(event));
      this.updateGestureState({
        ...getStartGestureState(this, values, event),
        ...getGenericPayload(this, event, true),
        _pointerIds: pointerIds,
        // consistent with touch version
        cancel: this.onCancel,
        origin
      });
      this.updateGestureState(this.getMovement(values));
      this.fireGestureHandler();
    });
    // Pointer-based change
    __publicField$2(this, "onPointerMove", (event) => {
      const { canceled, _active } = this.state;
      if (canceled || !_active)
        return;
      if (!this.gesturePointerIds?.includes(event.pointerId)) {
        if (this.activePointers.has(event.pointerId)) {
          this.activePointers.set(event.pointerId, event);
        }
        return;
      }
      this.activePointers.set(event.pointerId, event);
      const data = this.getPointerValues(this.gesturePointerIds);
      if (!data)
        return;
      const { values, origin } = data;
      this.updateSharedState(getGenericEventData(event));
      const kinematics = this.getKinematicsForPointer(values, event);
      this.updateGestureState({
        ...getGenericPayload(this, event),
        ...kinematics,
        origin
      });
      this.fireGestureHandler();
    });
    // Pointer end
    __publicField$2(this, "onPointerUp", (event) => {
      if (!this.activePointers.has(event.pointerId))
        return;
      this.activePointers.delete(event.pointerId);
      if (!this.state._active) {
        if (this.activePointers.size === 0) {
          this.gesturePointerIds = null;
        }
        return;
      }
      if (this.gesturePointerIds?.includes(event.pointerId)) {
        this.clean();
        this.updateGestureState({
          ...getGenericPayload(this, event),
          ...this.getMovement(this.state.values),
          _active: false
        });
        this.gesturePointerIds = null;
        this.fireGestureHandler();
      }
    });
    // Pointer cancel
    __publicField$2(this, "onPointerCancel", (event) => {
      if (this.activePointers.has(event.pointerId)) {
        this.activePointers.delete(event.pointerId);
      }
      this.gesturePointerIds = null;
      this.clean();
      this.onCancel();
    });
  }
  addBindings(bindings) {
    if (this.controller.supportsPointerEvents) {
      addBindings(bindings, "onPointerDown", this.onPointerDown);
      addBindings(bindings, "onPointerMove", this.onPointerMove);
      addBindings(bindings, "onPointerUp", this.onPointerUp);
      addBindings(bindings, "onPointerCancel", this.onPointerCancel);
      addBindings(bindings, "onWheel", this.onWheel);
      return;
    }
    if (this.controller.config.domTarget && !this.controller.supportsTouchEvents && this.controller.supportsGestureEvents) {
      addBindings(bindings, "onGestureStart", this.onGestureStart);
      addBindings(bindings, "onGestureChange", this.onGestureChange);
      addBindings(bindings, "onGestureEnd", this.onGestureEnd);
    } else {
      addBindings(bindings, "onTouchStart", this.onPinchStart);
      addBindings(bindings, "onTouchMove", this.onPinchChange);
      addBindings(bindings, "onTouchEnd", this.onPinchEnd);
      addBindings(bindings, "onTouchCancel", this.onPinchEnd);
      addBindings(bindings, "onWheel", this.onWheel);
    }
  }
  // Helper: get values for exactly two pointer IDs
  getPointerValues(pointerIds) {
    const [id1, id2] = pointerIds;
    const p1 = this.activePointers.get(id1);
    const p2 = this.activePointers.get(id2);
    if (!p1 || !p2)
      return null;
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const values = [distance, angle];
    const origin = [
      (p1.clientX + p2.clientX) / 2,
      (p1.clientY + p2.clientY) / 2
    ];
    return { values, origin };
  }
  getKinematicsForPointer(values, event) {
    const state = this.getMovement(values);
    const now = event.timeStamp;
    const prev = this.state.timeStamp ?? now;
    const dt = Math.max(now - prev, 1);
    const { delta } = state;
    const dl = Math.hypot(delta[0], delta[1]);
    const vl = dl / dt;
    const prevVelocity = this.state.velocity ?? 0;
    const smoothingFactor = 0.3;
    const smoothedVelocity = prevVelocity * smoothingFactor + vl * (1 - smoothingFactor);
    const velocities = [delta[0] / dt, delta[1] / dt];
    const angle = dl > 0 ? Math.atan2(delta[1], delta[0]) : this.state.vdva?.[1] ?? 0;
    return {
      ...state,
      velocity: smoothedVelocity,
      velocities,
      vdva: [smoothedVelocity, angle]
    };
  }
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class ScrollRecognizer extends CoordinatesRecognizer {
  constructor() {
    super(...arguments);
    __publicField$1(this, "ingKey", "scrolling");
    __publicField$1(this, "stateKey", "scroll");
    __publicField$1(this, "debounced", true);
    __publicField$1(this, "handleEvent", (event) => {
      if (!this.enabled)
        return;
      this.clearTimeout();
      this.setTimeout(this.onEnd);
      const values = getScrollEventValues(event, this.transform);
      this.updateSharedState(getGenericEventData(event));
      if (!this.state._active) {
        this.updateGestureState({
          ...getStartGestureState(this, values, event),
          ...getGenericPayload(this, event, true),
          initial: this.state.values
        });
        const movementDetection = this.getMovement(values);
        const geometry = calculateAllGeometry(movementDetection.delta);
        this.updateGestureState(movementDetection);
        this.updateGestureState(geometry);
      } else {
        this.updateGestureState({
          ...getGenericPayload(this, event),
          ...this.getKinematics(values, event)
        });
      }
      this.fireGestureHandler();
    });
    __publicField$1(this, "onEnd", () => {
      this.clean();
      if (!this.state._active)
        return;
      this.updateGestureState({
        ...this.getMovement(this.state.values),
        _active: false,
        velocities: [0, 0],
        velocity: 0
      });
      this.fireGestureHandler();
    });
  }
  addBindings(bindings) {
    addBindings(bindings, "onScroll", this.handleEvent);
  }
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class WheelRecognizer extends CoordinatesRecognizer {
  constructor() {
    super(...arguments);
    __publicField(this, "ingKey", "wheeling");
    __publicField(this, "stateKey", "wheel");
    __publicField(this, "debounced", true);
    __publicField(this, "handleEvent", (event) => {
      if (event.ctrlKey && "pinch" in this.controller.handlers)
        return;
      if (!this.enabled)
        return;
      this.setTimeout(this.onEnd);
      this.updateSharedState(getGenericEventData(event));
      const values = addV(
        getWheelEventValues(event, this.transform),
        this.state.values
      );
      if (!this.state._active) {
        this.updateGestureState({
          ...getStartGestureState(this, values, event),
          ...getGenericPayload(this, event, true),
          initial: this.state.values
        });
        const movement = this.getMovement(values);
        const geometry = calculateAllGeometry(movement.delta);
        this.updateGestureState(movement);
        this.updateGestureState(geometry);
      } else {
        this.updateGestureState({
          ...getGenericPayload(this, event),
          ...this.getKinematics(values, event)
        });
      }
      this.fireGestureHandler();
    });
    __publicField(this, "onEnd", () => {
      this.clean();
      if (!this.state._active)
        return;
      const movement = this.getMovement(this.state.values);
      this.updateGestureState(movement);
      this.updateGestureState({ _active: false, velocities: [0, 0], velocity: 0 });
      this.fireGestureHandler();
    });
  }
  addBindings(bindings) {
    addBindings(bindings, "onWheel", this.handleEvent);
  }
}

const RE_NOT_NATIVE = /^on(Drag|Wheel|Scroll|Move|Pinch|Hover)/;
function sortHandlers(handlers) {
  const native = {};
  const handle = {};
  const actions = /* @__PURE__ */ new Set();
  for (let key in handlers) {
    if (RE_NOT_NATIVE.test(key)) {
      actions.add(RegExp.lastMatch);
      handle[key] = handlers[key];
    } else {
      native[key] = handlers[key];
    }
  }
  return [handle, native, actions];
}
function useGesture(_handlers, config) {
  const [handlers, nativeHandlers, actions] = sortHandlers(_handlers);
  RecognizersMap.set("drag", DragRecognizer);
  RecognizersMap.set("hover", MoveRecognizer);
  RecognizersMap.set("move", MoveRecognizer);
  RecognizersMap.set("pinch", PinchRecognizer);
  RecognizersMap.set("scroll", ScrollRecognizer);
  RecognizersMap.set("wheel", WheelRecognizer);
  const mergedConfig = buildComplexConfig(config, actions);
  const internalHandlers = {};
  if (actions.has("onDrag"))
    internalHandlers.drag = includeStartEndHandlers(handlers, "onDrag");
  if (actions.has("onWheel"))
    internalHandlers.wheel = includeStartEndHandlers(handlers, "onWheel");
  if (actions.has("onScroll"))
    internalHandlers.scroll = includeStartEndHandlers(handlers, "onScroll");
  if (actions.has("onMove"))
    internalHandlers.move = includeStartEndHandlers(handlers, "onMove");
  if (actions.has("onPinch"))
    internalHandlers.pinch = includeStartEndHandlers(handlers, "onPinch");
  if (actions.has("onHover"))
    internalHandlers.hover = handlers.onHover;
  return useRecognizers(internalHandlers, mergedConfig, nativeHandlers);
}
function includeStartEndHandlers(handlers, handlerKey) {
  const startKey = handlerKey + "Start";
  const endKey = handlerKey + "End";
  const fn = (state) => {
    let memo = void 0;
    if (state.first && startKey in handlers)
      handlers[startKey](state);
    if (handlerKey in handlers)
      memo = handlers[handlerKey](state);
    if (state.last && endKey in handlers)
      handlers[endKey](state);
    return memo;
  };
  return fn;
}

function useHover(handler, config = {}) {
  RecognizersMap.set("hover", MoveRecognizer);
  const buildHoverConfig = vueDemi.ref();
  if (!buildHoverConfig.value) {
    buildHoverConfig.value = memoizeOne(_buildHoverConfig, isEqual);
  }
  return useRecognizers({ hover: handler }, buildHoverConfig.value(config));
}

function useMove(handler, config = {}) {
  RecognizersMap.set("move", MoveRecognizer);
  const buildMoveConfig = vueDemi.ref();
  if (!buildMoveConfig.value) {
    buildMoveConfig.value = memoizeOne(_buildMoveConfig, isEqual);
  }
  return useRecognizers({ move: handler }, buildMoveConfig.value(config));
}

function usePinch(handler, config = {}) {
  RecognizersMap.set("pinch", PinchRecognizer);
  const buildPinchConfig = vueDemi.ref();
  if (!buildPinchConfig.value) {
    buildPinchConfig.value = memoizeOne(_buildPinchConfig, isEqual);
  }
  return useRecognizers({ pinch: handler }, buildPinchConfig.value(config));
}

function useScroll(handler, config = {}) {
  RecognizersMap.set("scroll", ScrollRecognizer);
  const buildScrollConfig = vueDemi.ref();
  if (!buildScrollConfig.value) {
    buildScrollConfig.value = memoizeOne(_buildScrollConfig, isEqual);
  }
  return useRecognizers({ scroll: handler }, buildScrollConfig.value(config));
}

function useWheel(handler, config = {}) {
  RecognizersMap.set("wheel", WheelRecognizer);
  const buildWheelConfig = vueDemi.ref();
  if (!buildWheelConfig.value) {
    buildWheelConfig.value = memoizeOne(_buildWheelConfig, isEqual);
  }
  return useRecognizers({ wheel: handler }, buildWheelConfig.value(config));
}

const directive = (register, unregister) => {
  return {
    // Vue 3 Directive Hooks
    created: register,
    unmounted: unregister,
    // Vue 2 Directive Hooks
    // @ts-expect-error
    bind: register,
    unbind: unregister
  };
};

const errorMessage = (type) => `Your v-${type} directive must have a handler specified as a value`;
const drag = () => {
  const register = (el, binding, node) => {
    if (!binding.value) {
      throw new Error(errorMessage("drag"));
    }
    if (!el.gestures) {
      el.gestures = {};
    }
    const controller = useDrag(binding.value, {
      domTarget: el,
      manual: true
    });
    controller.bind();
    el.gestures.drag = controller;
  };
  const unregister = (el, binding, node) => {
    if (!el.gestures || !el.gestures.drag)
      return;
    el.gestures.drag.clean();
  };
  return directive(register, unregister);
};
const move = () => {
  const register = (el, binding, node) => {
    if (!binding.value) {
      throw new Error(errorMessage("move"));
    }
    if (!el.gestures) {
      el.gestures = {};
    }
    const controller = useMove(binding.value, {
      domTarget: el,
      manual: true
    });
    controller.bind();
    el.gestures.move = controller;
  };
  const unregister = (el, binding, node) => {
    if (!el.gestures || !el.gestures.move)
      return;
    el.gestures.move.clean();
  };
  return directive(register, unregister);
};
const hover = () => {
  const register = (el, binding, node) => {
    if (!binding.value) {
      throw new Error(errorMessage("hover"));
    }
    if (!el.gestures) {
      el.gestures = {};
    }
    const controller = useHover(binding.value, {
      domTarget: el,
      manual: true
    });
    controller.bind();
    el.gestures.hover = controller;
  };
  const unregister = (el, binding, node) => {
    if (!el.gestures || !el.gestures.hover)
      return;
    el.gestures.hover.clean();
  };
  return directive(register, unregister);
};
const pinch = () => {
  const register = (el, binding, node) => {
    if (!binding.value) {
      throw new Error(errorMessage("pinch"));
    }
    if (!el.gestures) {
      el.gestures = {};
    }
    const controller = usePinch(binding.value, {
      domTarget: el,
      manual: true
    });
    controller.bind();
    el.gestures.pinch = controller;
  };
  const unregister = (el, binding, node) => {
    if (!el.gestures || !el.gestures.pinch)
      return;
    el.gestures.pinch.clean();
  };
  return directive(register, unregister);
};
const wheel = () => {
  const register = (el, binding, node) => {
    if (!binding.value) {
      throw new Error(errorMessage("wheel"));
    }
    if (!el.gestures) {
      el.gestures = {};
    }
    const controller = useWheel(binding.value, {
      domTarget: el,
      manual: true
    });
    controller.bind();
    el.gestures.wheel = controller;
  };
  const unregister = (el, binding, node) => {
    if (!el.gestures || !el.gestures.wheel)
      return;
    el.gestures.wheel.clean();
  };
  return directive(register, unregister);
};
const scroll = () => {
  const register = (el, binding, node) => {
    if (!binding.value) {
      throw new Error(errorMessage("scroll"));
    }
    if (!el.gestures) {
      el.gestures = {};
    }
    const controller = useScroll(binding.value, {
      domTarget: el,
      manual: true
    });
    controller.bind();
    el.gestures.drag = controller;
  };
  const unregister = (el, binding, node) => {
    if (!el.gestures || !el.gestures.drag)
      return;
    el.gestures.drag.clean();
  };
  return directive(register, unregister);
};

const GesturePlugin = {
  install(app, options) {
    const directives = { drag, hover, move, pinch, scroll, wheel };
    Object.entries(directives).forEach(
      ([key, directive]) => app.directive(key, directive())
    );
  }
};

exports.GesturePlugin = GesturePlugin;
exports.addV = addV;
exports.dragDirective = drag;
exports.hoverDirective = hover;
exports.moveDirective = move;
exports.pinchDirective = pinch;
exports.rubberbandIfOutOfBounds = rubberbandIfOutOfBounds;
exports.scrollDirective = scroll;
exports.subV = subV;
exports.useDrag = useDrag;
exports.useGesture = useGesture;
exports.useHover = useHover;
exports.useMove = useMove;
exports.usePinch = usePinch;
exports.useScroll = useScroll;
exports.useWheel = useWheel;
exports.wheelDirective = wheel;
