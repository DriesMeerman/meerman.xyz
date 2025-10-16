
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	/**
	 * @template T
	 * @template S
	 * @param {T} tar
	 * @param {S} src
	 * @returns {T & S}
	 */
	function assign(tar, src) {
		// @ts-ignore
		for (const k in src) tar[k] = src[k];
		return /** @type {T & S} */ (tar);
	}

	// Adapted from https://github.com/then/is-promise/blob/master/index.js
	// Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
	/**
	 * @param {any} value
	 * @returns {value is PromiseLike<any>}
	 */
	function is_promise(value) {
		return (
			!!value &&
			(typeof value === 'object' || typeof value === 'function') &&
			typeof (/** @type {any} */ (value).then) === 'function'
		);
	}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	let src_url_equal_anchor;

	/**
	 * @param {string} element_src
	 * @param {string} url
	 * @returns {boolean}
	 */
	function src_url_equal(element_src, url) {
		if (element_src === url) return true;
		if (!src_url_equal_anchor) {
			src_url_equal_anchor = document.createElement('a');
		}
		// This is actually faster than doing URL(..).href
		src_url_equal_anchor.href = url;
		return element_src === src_url_equal_anchor.href;
	}

	/** @param {string} srcset */
	function split_srcset(srcset) {
		return srcset.split(',').map((src) => src.trim().split(' ').filter(Boolean));
	}

	/**
	 * @param {HTMLSourceElement | HTMLImageElement} element_srcset
	 * @param {string | undefined | null} srcset
	 * @returns {boolean}
	 */
	function srcset_url_equal(element_srcset, srcset) {
		const element_urls = split_srcset(element_srcset.srcset);
		const urls = split_srcset(srcset || '');

		return (
			urls.length === element_urls.length &&
			urls.every(
				([url, width], i) =>
					width === element_urls[i][1] &&
					// We need to test both ways because Vite will create an a full URL with
					// `new URL(asset, import.meta.url).href` for the client when `base: './'`, and the
					// relative URLs inside srcset are not automatically resolved to absolute URLs by
					// browsers (in contrast to img.src). This means both SSR and DOM code could
					// contain relative or absolute URLs.
					(src_url_equal(element_urls[i][0], url) || src_url_equal(url, element_urls[i][0]))
			)
		);
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/** @returns {void} */
	function validate_store(store, name) {
		if (store != null && typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(store, ...callbacks) {
		if (store == null) {
			for (const callback of callbacks) {
				callback(undefined);
			}
			return noop;
		}
		const unsub = store.subscribe(...callbacks);
		return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}

	/** @returns {void} */
	function component_subscribe(component, store, callback) {
		component.$$.on_destroy.push(subscribe(store, callback));
	}

	function create_slot(definition, ctx, $$scope, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, $$scope, fn) {
		return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
	}

	function get_slot_changes(definition, $$scope, dirty, fn) {
		if (definition[2] && fn) {
			const lets = definition[2](fn(dirty));
			if ($$scope.dirty === undefined) {
				return lets;
			}
			if (typeof lets === 'object') {
				const merged = [];
				const len = Math.max($$scope.dirty.length, lets.length);
				for (let i = 0; i < len; i += 1) {
					merged[i] = $$scope.dirty[i] | lets[i];
				}
				return merged;
			}
			return $$scope.dirty | lets;
		}
		return $$scope.dirty;
	}

	/** @returns {void} */
	function update_slot_base(
		slot,
		slot_definition,
		ctx,
		$$scope,
		slot_changes,
		get_slot_context_fn
	) {
		if (slot_changes) {
			const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
			slot.p(slot_context, slot_changes);
		}
	}

	/** @returns {any[] | -1} */
	function get_all_dirty_from_scope($$scope) {
		if ($$scope.ctx.length > 32) {
			const dirty = [];
			const length = $$scope.ctx.length / 32;
			for (let i = 0; i < length; i++) {
				dirty[i] = -1;
			}
			return dirty;
		}
		return -1;
	}

	/** @returns {{}} */
	function compute_slots(slots) {
		const result = {};
		for (const key in slots) {
			result[key] = true;
		}
		return result;
	}

	function null_to_empty(value) {
		return value == null ? '' : value;
	}

	function action_destroyer(action_result) {
		return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @template {keyof SVGElementTagNameMap} K
	 * @param {K} name
	 * @returns {SVGElement}
	 */
	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, important ? 'important' : '');
		}
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}
	/** */
	class HtmlTag {
		/**
		 * @private
		 * @default false
		 */
		is_svg = false;
		/** parent for creating node */
		e = undefined;
		/** html tag nodes */
		n = undefined;
		/** target */
		t = undefined;
		/** anchor */
		a = undefined;
		constructor(is_svg = false) {
			this.is_svg = is_svg;
			this.e = this.n = null;
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		c(html) {
			this.h(html);
		}

		/**
		 * @param {string} html
		 * @param {HTMLElement | SVGElement} target
		 * @param {HTMLElement | SVGElement} anchor
		 * @returns {void}
		 */
		m(html, target, anchor = null) {
			if (!this.e) {
				if (this.is_svg)
					this.e = svg_element(/** @type {keyof SVGElementTagNameMap} */ (target.nodeName));
				/** #7364  target for <template> may be provided as #document-fragment(11) */ else
					this.e = element(
						/** @type {keyof HTMLElementTagNameMap} */ (
							target.nodeType === 11 ? 'TEMPLATE' : target.nodeName
						)
					);
				this.t =
					target.tagName !== 'TEMPLATE'
						? target
						: /** @type {HTMLTemplateElement} */ (target).content;
				this.c(html);
			}
			this.i(anchor);
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		h(html) {
			this.e.innerHTML = html;
			this.n = Array.from(
				this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes
			);
		}

		/**
		 * @returns {void} */
		i(anchor) {
			for (let i = 0; i < this.n.length; i += 1) {
				insert(this.t, this.n[i], anchor);
			}
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		p(html) {
			this.d();
			this.h(html);
			this.i(this.a);
		}

		/**
		 * @returns {void} */
		d() {
			this.n.forEach(detach);
		}
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * Schedules a callback to run immediately before the component is unmounted.
	 *
	 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
	 * only one that runs inside a server-side component.
	 *
	 * https://svelte.dev/docs/svelte#ondestroy
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	/**
	 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
	 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
	 *
	 * Component events created with `createEventDispatcher` create a
	 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
	 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
	 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
	 * property and can contain any type of data.
	 *
	 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
	 * ```ts
	 * const dispatch = createEventDispatcher<{
	 *  loaded: never; // does not take a detail argument
	 *  change: string; // takes a detail argument of type string, which is required
	 *  optional: number | null; // takes an optional detail argument of type number
	 * }>();
	 * ```
	 *
	 * https://svelte.dev/docs/svelte#createeventdispatcher
	 * @template {Record<string, any>} [EventMap=any]
	 * @returns {import('./public.js').EventDispatcher<EventMap>}
	 */
	function createEventDispatcher() {
		const component = get_current_component();
		return (type, detail, { cancelable = false } = {}) => {
			const callbacks = component.$$.callbacks[type];
			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
				callbacks.slice().forEach((fn) => {
					fn.call(component, event);
				});
				return !event.defaultPrevented;
			}
			return true;
		};
	}

	/**
	 * Associates an arbitrary `context` object with the current component and the specified `key`
	 * and returns that object. The context is then available to children of the component
	 * (including slotted content) with `getContext`.
	 *
	 * Like lifecycle functions, this must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#setcontext
	 * @template T
	 * @param {any} key
	 * @param {T} context
	 * @returns {T}
	 */
	function setContext(key, context) {
		get_current_component().$$.context.set(key, context);
		return context;
	}

	/**
	 * Retrieves the context that belongs to the closest parent component with the specified `key`.
	 * Must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#getcontext
	 * @template T
	 * @param {any} key
	 * @returns {T}
	 */
	function getContext(key) {
		return get_current_component().$$.context.get(key);
	}

	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	/**
	 * @param component
	 * @param event
	 * @returns {void}
	 */
	function bubble(component, event) {
		const callbacks = component.$$.callbacks[event.type];
		if (callbacks) {
			// @ts-ignore
			callbacks.slice().forEach((fn) => fn.call(this, event));
		}
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {Promise<void>} */
	function tick() {
		schedule_update();
		return resolved_promise;
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	/**
	 * @template T
	 * @param {Promise<T>} promise
	 * @param {import('./private.js').PromiseInfo<T>} info
	 * @returns {boolean}
	 */
	function handle_promise(promise, info) {
		const token = (info.token = {});
		/**
		 * @param {import('./private.js').FragmentFactory} type
		 * @param {0 | 1 | 2} index
		 * @param {number} [key]
		 * @param {any} [value]
		 * @returns {void}
		 */
		function update(type, index, key, value) {
			if (info.token !== token) return;
			info.resolved = value;
			let child_ctx = info.ctx;
			if (key !== undefined) {
				child_ctx = child_ctx.slice();
				child_ctx[key] = value;
			}
			const block = type && (info.current = type)(child_ctx);
			let needs_flush = false;
			if (info.block) {
				if (info.blocks) {
					info.blocks.forEach((block, i) => {
						if (i !== index && block) {
							group_outros();
							transition_out(block, 1, 1, () => {
								if (info.blocks[i] === block) {
									info.blocks[i] = null;
								}
							});
							check_outros();
						}
					});
				} else {
					info.block.d(1);
				}
				block.c();
				transition_in(block, 1);
				block.m(info.mount(), info.anchor);
				needs_flush = true;
			}
			info.block = block;
			if (info.blocks) info.blocks[index] = block;
			if (needs_flush) {
				flush();
			}
		}
		if (is_promise(promise)) {
			const current_component = get_current_component();
			promise.then(
				(value) => {
					set_current_component(current_component);
					update(info.then, 1, info.value, value);
					set_current_component(null);
				},
				(error) => {
					set_current_component(current_component);
					update(info.catch, 2, info.error, error);
					set_current_component(null);
					if (!info.hasCatch) {
						throw error;
					}
				}
			);
			// if we previously had a then/catch block, destroy it
			if (info.current !== info.pending) {
				update(info.pending, 0);
				return true;
			}
		} else {
			if (info.current !== info.then) {
				update(info.then, 1, info.value, promise);
				return true;
			}
			info.resolved = /** @type {T} */ (promise);
		}
	}

	/** @returns {void} */
	function update_await_block_branch(info, ctx, dirty) {
		const child_ctx = ctx.slice();
		const { resolved } = info;
		if (info.current === info.then) {
			child_ctx[info.value] = resolved;
		}
		if (info.current === info.catch) {
			child_ctx[info.error] = resolved;
		}
		info.block.p(child_ctx, dirty);
	}

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {{}} */
	function get_spread_update(levels, updates) {
		const update = {};
		const to_null_out = {};
		const accounted_for = { $$scope: 1 };
		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];
			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}
				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}
				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}
		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}
		return update;
	}

	function get_spread_object(spread_props) {
		return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.20';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	function construct_svelte_component_dev(component, props) {
		const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
		try {
			const instance = new component(props);
			if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
				throw new Error(error_message);
			}
			return instance;
		} catch (err) {
			const { message } = err;
			if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
				throw new Error(error_message);
			} else {
				throw err;
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/**
	 * @typedef {Object} WrappedComponent Object returned by the `wrap` method
	 * @property {SvelteComponent} component - Component to load (this is always asynchronous)
	 * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
	 * @property {Object} [props] - Optional dictionary of static props
	 * @property {Object} [userData] - Optional user data dictionary
	 * @property {bool} _sveltesparouter - Internal flag; always set to true
	 */

	/**
	 * @callback AsyncSvelteComponent
	 * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
	 */

	/**
	 * @callback RoutePrecondition
	 * @param {RouteDetail} detail - Route detail object
	 * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
	 */

	/**
	 * @typedef {Object} WrapOptions Options object for the call to `wrap`
	 * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
	 * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
	 * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
	 * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
	 * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
	 * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
	 * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
	 */

	/**
	 * Wraps a component to enable multiple capabilities:
	 * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
	 * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
	 * 3. Adding static props that are passed to the component
	 * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
	 * 
	 * @param {WrapOptions} args - Arguments object
	 * @returns {WrappedComponent} Wrapped component
	 */
	function wrap$1(args) {
	    if (!args) {
	        throw Error('Parameter args is required')
	    }

	    // We need to have one and only one of component and asyncComponent
	    // This does a "XNOR"
	    if (!args.component == !args.asyncComponent) {
	        throw Error('One and only one of component and asyncComponent is required')
	    }

	    // If the component is not async, wrap it into a function returning a Promise
	    if (args.component) {
	        args.asyncComponent = () => Promise.resolve(args.component);
	    }

	    // Parameter asyncComponent and each item of conditions must be functions
	    if (typeof args.asyncComponent != 'function') {
	        throw Error('Parameter asyncComponent must be a function')
	    }
	    if (args.conditions) {
	        // Ensure it's an array
	        if (!Array.isArray(args.conditions)) {
	            args.conditions = [args.conditions];
	        }
	        for (let i = 0; i < args.conditions.length; i++) {
	            if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
	                throw Error('Invalid parameter conditions[' + i + ']')
	            }
	        }
	    }

	    // Check if we have a placeholder component
	    if (args.loadingComponent) {
	        args.asyncComponent.loading = args.loadingComponent;
	        args.asyncComponent.loadingParams = args.loadingParams || undefined;
	    }

	    // Returns an object that contains all the functions to execute too
	    // The _sveltesparouter flag is to confirm the object was created by this router
	    const obj = {
	        component: args.asyncComponent,
	        userData: args.userData,
	        conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
	        props: (args.props && Object.keys(args.props).length) ? args.props : {},
	        _sveltesparouter: true
	    };

	    return obj
	}

	/** @returns {void} */
	function afterUpdate() {}

	const subscriber_queue = [];

	/**
	 * Creates a `Readable` store that allows reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#readable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function readable(value, start) {
		return {
			subscribe: writable(value, start).subscribe
		};
	}

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
					}
					if (run_queue) {
						for (let i = 0; i < subscriber_queue.length; i += 2) {
							subscriber_queue[i][0](subscriber_queue[i + 1]);
						}
						subscriber_queue.length = 0;
					}
				}
			}
		}

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
					stop();
					stop = null;
				}
			};
		}
		return { set, update, subscribe };
	}

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>, set: (value: T) => void, update: (fn: import('./public.js').Updater<T>) => void) => import('./public.js').Unsubscriber | void} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>) => T} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @param {S} stores
	 * @param {Function} fn
	 * @param {T} [initial_value]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function derived(stores, fn, initial_value) {
		const single = !Array.isArray(stores);
		/** @type {Array<import('./public.js').Readable<any>>} */
		const stores_array = single ? [stores] : stores;
		if (!stores_array.every(Boolean)) {
			throw new Error('derived() expects stores as input, got a falsy value');
		}
		const auto = fn.length < 2;
		return readable(initial_value, (set, update) => {
			let started = false;
			const values = [];
			let pending = 0;
			let cleanup = noop;
			const sync = () => {
				if (pending) {
					return;
				}
				cleanup();
				const result = fn(single ? values[0] : values, set, update);
				if (auto) {
					set(result);
				} else {
					cleanup = is_function(result) ? result : noop;
				}
			};
			const unsubscribers = stores_array.map((store, i) =>
				subscribe(
					store,
					(value) => {
						values[i] = value;
						pending &= ~(1 << i);
						if (started) {
							sync();
						}
					},
					() => {
						pending |= 1 << i;
					}
				)
			);
			started = true;
			sync();
			return function stop() {
				run_all(unsubscribers);
				cleanup();
				// We need to set this to false because callbacks can still happen despite having unsubscribed:
				// Callbacks might already be placed in the queue which doesn't know it should no longer
				// invoke this derived store.
				started = false;
			};
		});
	}

	function parse(str, loose) {
		if (str instanceof RegExp) return { keys:false, pattern:str };
		var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
		arr[0] || arr.shift();

		while (tmp = arr.shift()) {
			c = tmp[0];
			if (c === '*') {
				keys.push('wild');
				pattern += '/(.*)';
			} else if (c === ':') {
				o = tmp.indexOf('?', 1);
				ext = tmp.indexOf('.', 1);
				keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
				pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
				if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
			} else {
				pattern += '/' + tmp;
			}
		}

		return {
			keys: keys,
			pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
		};
	}

	/* node_modules/svelte-spa-router/Router.svelte generated by Svelte v4.2.20 */

	const { Error: Error_1$1, Object: Object_1$1, console: console_1$1 } = globals;

	// (267:0) {:else}
	function create_else_block$7(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		const switch_instance_spread_levels = [/*props*/ ctx[2]];
		var switch_value = /*component*/ ctx[0];

		function switch_props(ctx, dirty) {
			let switch_instance_props = {};

			for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
				switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
			}

			if (dirty !== undefined && dirty & /*props*/ 4) {
				switch_instance_props = assign(switch_instance_props, get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])]));
			}

			return {
				props: switch_instance_props,
				$$inline: true
			};
		}

		if (switch_value) {
			switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
			switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx, dirty));
						switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = (dirty & /*props*/ 4)
					? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
					: {};

					switch_instance.$set(switch_instance_changes);
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$7.name,
			type: "else",
			source: "(267:0) {:else}",
			ctx
		});

		return block;
	}

	// (260:0) {#if componentParams}
	function create_if_block$9(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
		var switch_value = /*component*/ ctx[0];

		function switch_props(ctx, dirty) {
			let switch_instance_props = {};

			for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
				switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
			}

			if (dirty !== undefined && dirty & /*componentParams, props*/ 6) {
				switch_instance_props = assign(switch_instance_props, get_spread_update(switch_instance_spread_levels, [
					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
				]));
			}

			return {
				props: switch_instance_props,
				$$inline: true
			};
		}

		if (switch_value) {
			switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
			switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx, dirty));
						switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
					? get_spread_update(switch_instance_spread_levels, [
							dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
							dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
						])
					: {};

					switch_instance.$set(switch_instance_changes);
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$9.name,
			type: "if",
			source: "(260:0) {#if componentParams}",
			ctx
		});

		return block;
	}

	function create_fragment$s(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block$9, create_else_block$7];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*componentParams*/ ctx[1]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$s.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function wrap(component, userData, ...conditions) {
		// Use the new wrap method and show a deprecation warning
		// eslint-disable-next-line no-console
		console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

		return wrap$1({ component, userData, conditions });
	}

	/**
	 * @typedef {Object} Location
	 * @property {string} location - Location (page/view), for example `/book`
	 * @property {string} [querystring] - Querystring from the hash, as a string not parsed
	 */
	/**
	 * Returns the current location from the hash.
	 *
	 * @returns {Location} Location object
	 * @private
	 */
	function getLocation() {
		const hashPosition = window.location.href.indexOf('#/');

		let location = hashPosition > -1
		? window.location.href.substr(hashPosition + 1)
		: '/';

		// Check if there's a querystring
		const qsPosition = location.indexOf('?');

		let querystring = '';

		if (qsPosition > -1) {
			querystring = location.substr(qsPosition + 1);
			location = location.substr(0, qsPosition);
		}

		return { location, querystring };
	}

	const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
	function start(set) {
		set(getLocation());

		const update = () => {
			set(getLocation());
		};

		window.addEventListener('hashchange', update, false);

		return function stop() {
			window.removeEventListener('hashchange', update, false);
		};
	});

	const location = derived(loc, $loc => $loc.location);
	const querystring = derived(loc, $loc => $loc.querystring);
	const params = writable(undefined);

	async function push(location) {
		if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
			throw Error('Invalid parameter location');
		}

		// Execute this code when the current call stack is complete
		await tick();

		// Note: this will include scroll state in history even when restoreScrollState is false
		history.replaceState(
			{
				...history.state,
				__svelte_spa_router_scrollX: window.scrollX,
				__svelte_spa_router_scrollY: window.scrollY
			},
			undefined
		);

		window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
	}

	async function pop() {
		// Execute this code when the current call stack is complete
		await tick();

		window.history.back();
	}

	async function replace(location) {
		if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
			throw Error('Invalid parameter location');
		}

		// Execute this code when the current call stack is complete
		await tick();

		const dest = (location.charAt(0) == '#' ? '' : '#') + location;

		try {
			const newState = { ...history.state };
			delete newState['__svelte_spa_router_scrollX'];
			delete newState['__svelte_spa_router_scrollY'];
			window.history.replaceState(newState, undefined, dest);
		} catch(e) {
			// eslint-disable-next-line no-console
			console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
		}

		// The method above doesn't trigger the hashchange event, so let's do that manually
		window.dispatchEvent(new Event('hashchange'));
	}

	function link(node, opts) {
		opts = linkOpts(opts);

		// Only apply to <a> tags
		if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
			throw Error('Action "link" can only be used with <a> tags');
		}

		updateLink(node, opts);

		return {
			update(updated) {
				updated = linkOpts(updated);
				updateLink(node, updated);
			}
		};
	}

	function restoreScroll(state) {
		// If this exists, then this is a back navigation: restore the scroll position
		if (state) {
			window.scrollTo(state.__svelte_spa_router_scrollX, state.__svelte_spa_router_scrollY);
		} else {
			// Otherwise this is a forward navigation: scroll to top
			window.scrollTo(0, 0);
		}
	}

	// Internal function used by the link function
	function updateLink(node, opts) {
		let href = opts.href || node.getAttribute('href');

		// Destination must start with '/' or '#/'
		if (href && href.charAt(0) == '/') {
			// Add # to the href attribute
			href = '#' + href;
		} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
			throw Error('Invalid value for "href" attribute: ' + href);
		}

		node.setAttribute('href', href);

		node.addEventListener('click', event => {
			// Prevent default anchor onclick behaviour
			event.preventDefault();

			if (!opts.disabled) {
				scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
			}
		});
	}

	// Internal function that ensures the argument of the link action is always an object
	function linkOpts(val) {
		if (val && typeof val == 'string') {
			return { href: val };
		} else {
			return val || {};
		}
	}

	/**
	 * The handler attached to an anchor tag responsible for updating the
	 * current history state with the current scroll state
	 *
	 * @param {string} href - Destination
	 */
	function scrollstateHistoryHandler(href) {
		// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
		history.replaceState(
			{
				...history.state,
				__svelte_spa_router_scrollX: window.scrollX,
				__svelte_spa_router_scrollY: window.scrollY
			},
			undefined
		);

		// This will force an update as desired, but this time our scroll state will be attached
		window.location.hash = href;
	}

	function instance$s($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Router', slots, []);
		let { routes = {} } = $$props;
		let { prefix = '' } = $$props;
		let { restoreScrollState = false } = $$props;

		/**
	 * Container for a route: path, component
	 */
		class RouteItem {
			/**
	 * Initializes the object and creates a regular expression from the path, using regexparam.
	 *
	 * @param {string} path - Path to the route (must start with '/' or '*')
	 * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
	 */
			constructor(path, component) {
				if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
					throw Error('Invalid component object');
				}

				// Path must be a regular or expression, or a string starting with '/' or '*'
				if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
					throw Error('Invalid value for "path" argument - strings must start with / or *');
				}

				const { pattern, keys } = parse(path);
				this.path = path;

				// Check if the component is wrapped and we have conditions
				if (typeof component == 'object' && component._sveltesparouter === true) {
					this.component = component.component;
					this.conditions = component.conditions || [];
					this.userData = component.userData;
					this.props = component.props || {};
				} else {
					// Convert the component to a function that returns a Promise, to normalize it
					this.component = () => Promise.resolve(component);

					this.conditions = [];
					this.props = {};
				}

				this._pattern = pattern;
				this._keys = keys;
			}

			/**
	 * Checks if `path` matches the current route.
	 * If there's a match, will return the list of parameters from the URL (if any).
	 * In case of no match, the method will return `null`.
	 *
	 * @param {string} path - Path to test
	 * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
	 */
			match(path) {
				// If there's a prefix, check if it matches the start of the path.
				// If not, bail early, else remove it before we run the matching.
				if (prefix) {
					if (typeof prefix == 'string') {
						if (path.startsWith(prefix)) {
							path = path.substr(prefix.length) || '/';
						} else {
							return null;
						}
					} else if (prefix instanceof RegExp) {
						const match = path.match(prefix);

						if (match && match[0]) {
							path = path.substr(match[0].length) || '/';
						} else {
							return null;
						}
					}
				}

				// Check if the pattern matches
				const matches = this._pattern.exec(path);

				if (matches === null) {
					return null;
				}

				// If the input was a regular expression, this._keys would be false, so return matches as is
				if (this._keys === false) {
					return matches;
				}

				const out = {};
				let i = 0;

				while (i < this._keys.length) {
					// In the match parameters, URL-decode all values
					try {
						out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
					} catch(e) {
						out[this._keys[i]] = null;
					}

					i++;
				}

				return out;
			}

			/**
	 * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
	 * @typedef {Object} RouteDetail
	 * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
	 * @property {string} location - Location path
	 * @property {string} querystring - Querystring from the hash
	 * @property {object} [userData] - Custom data passed by the user
	 * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
	 * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
	 */
			/**
	 * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
	 * 
	 * @param {RouteDetail} detail - Route detail
	 * @returns {boolean} Returns true if all the conditions succeeded
	 */
			async checkConditions(detail) {
				for (let i = 0; i < this.conditions.length; i++) {
					if (!await this.conditions[i](detail)) {
						return false;
					}
				}

				return true;
			}
		}

		// Set up all routes
		const routesList = [];

		if (routes instanceof Map) {
			// If it's a map, iterate on it right away
			routes.forEach((route, path) => {
				routesList.push(new RouteItem(path, route));
			});
		} else {
			// We have an object, so iterate on its own properties
			Object.keys(routes).forEach(path => {
				routesList.push(new RouteItem(path, routes[path]));
			});
		}

		// Props for the component to render
		let component = null;

		let componentParams = null;
		let props = {};

		// Event dispatcher from Svelte
		const dispatch = createEventDispatcher();

		// Just like dispatch, but executes on the next iteration of the event loop
		async function dispatchNextTick(name, detail) {
			// Execute this code when the current call stack is complete
			await tick();

			dispatch(name, detail);
		}

		// If this is set, then that means we have popped into this var the state of our last scroll position
		let previousScrollState = null;

		let popStateChanged = null;

		if (restoreScrollState) {
			popStateChanged = event => {
				// If this event was from our history.replaceState, event.state will contain
				// our scroll history. Otherwise, event.state will be null (like on forward
				// navigation)
				if (event.state && (event.state.__svelte_spa_router_scrollY || event.state.__svelte_spa_router_scrollX)) {
					previousScrollState = event.state;
				} else {
					previousScrollState = null;
				}
			};

			// This is removed in the destroy() invocation below
			window.addEventListener('popstate', popStateChanged);
		}

		// Always have the latest value of loc
		let lastLoc = null;

		// Current object of the component loaded
		let componentObj = null;

		// Handle hash change events
		// Listen to changes in the $loc store and update the page
		// Do not use the $: syntax because it gets triggered by too many things
		const unsubscribeLoc = loc.subscribe(async newLoc => {
			lastLoc = newLoc;

			// Find a route matching the location
			let i = 0;

			while (i < routesList.length) {
				const match = routesList[i].match(newLoc.location);

				if (!match) {
					i++;
					continue;
				}

				const detail = {
					route: routesList[i].path,
					location: newLoc.location,
					querystring: newLoc.querystring,
					userData: routesList[i].userData,
					params: match && typeof match == 'object' && Object.keys(match).length
					? match
					: null
				};

				// Check if the route can be loaded - if all conditions succeed
				if (!await routesList[i].checkConditions(detail)) {
					// Don't display anything
					$$invalidate(0, component = null);

					componentObj = null;

					// Trigger an event to notify the user, then exit
					dispatchNextTick('conditionsFailed', detail);

					return;
				}

				// Trigger an event to alert that we're loading the route
				// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
				dispatchNextTick('routeLoading', Object.assign({}, detail));

				// If there's a component to show while we're loading the route, display it
				const obj = routesList[i].component;

				// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
				if (componentObj != obj) {
					if (obj.loading) {
						$$invalidate(0, component = obj.loading);
						componentObj = obj;
						$$invalidate(1, componentParams = obj.loadingParams);
						$$invalidate(2, props = {});

						// Trigger the routeLoaded event for the loading component
						// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
						dispatchNextTick('routeLoaded', Object.assign({}, detail, {
							component,
							name: component.name,
							params: componentParams
						}));
					} else {
						$$invalidate(0, component = null);
						componentObj = null;
					}

					// Invoke the Promise
					const loaded = await obj();

					// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
					if (newLoc != lastLoc) {
						// Don't update the component, just exit
						return;
					}

					// If there is a "default" property, which is used by async routes, then pick that
					$$invalidate(0, component = loaded && loaded.default || loaded);

					componentObj = obj;
				}

				// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
				// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
				if (match && typeof match == 'object' && Object.keys(match).length) {
					$$invalidate(1, componentParams = match);
				} else {
					$$invalidate(1, componentParams = null);
				}

				// Set static props, if any
				$$invalidate(2, props = routesList[i].props);

				// Dispatch the routeLoaded event then exit
				// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
				dispatchNextTick('routeLoaded', Object.assign({}, detail, {
					component,
					name: component.name,
					params: componentParams
				})).then(() => {
					params.set(componentParams);
				});

				return;
			}

			// If we're still here, there was no match, so show the empty component
			$$invalidate(0, component = null);

			componentObj = null;
			params.set(undefined);
		});

		onDestroy(() => {
			unsubscribeLoc();
			popStateChanged && window.removeEventListener('popstate', popStateChanged);
		});

		const writable_props = ['routes', 'prefix', 'restoreScrollState'];

		Object_1$1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
		});

		function routeEvent_handler(event) {
			bubble.call(this, $$self, event);
		}

		function routeEvent_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
			if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
			if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
		};

		$$self.$capture_state = () => ({
			readable,
			writable,
			derived,
			tick,
			_wrap: wrap$1,
			wrap,
			getLocation,
			loc,
			location,
			querystring,
			params,
			push,
			pop,
			replace,
			link,
			restoreScroll,
			updateLink,
			linkOpts,
			scrollstateHistoryHandler,
			onDestroy,
			createEventDispatcher,
			afterUpdate,
			parse,
			routes,
			prefix,
			restoreScrollState,
			RouteItem,
			routesList,
			component,
			componentParams,
			props,
			dispatch,
			dispatchNextTick,
			previousScrollState,
			popStateChanged,
			lastLoc,
			componentObj,
			unsubscribeLoc
		});

		$$self.$inject_state = $$props => {
			if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
			if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
			if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
			if ('component' in $$props) $$invalidate(0, component = $$props.component);
			if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
			if ('props' in $$props) $$invalidate(2, props = $$props.props);
			if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
			if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
			if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
			if ('componentObj' in $$props) componentObj = $$props.componentObj;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
				// Update history.scrollRestoration depending on restoreScrollState
				history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
			}
		};

		return [
			component,
			componentParams,
			props,
			routes,
			prefix,
			restoreScrollState,
			routeEvent_handler,
			routeEvent_handler_1
		];
	}

	class Router extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$s, create_fragment$s, safe_not_equal, {
				routes: 3,
				prefix: 4,
				restoreScrollState: 5
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Router",
				options,
				id: create_fragment$s.name
			});
		}

		get routes() {
			throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set routes(value) {
			throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get prefix() {
			throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set prefix(value) {
			throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get restoreScrollState() {
			throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set restoreScrollState(value) {
			throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	let storedTheme = localStorage.theme;
	let defaultMode = storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

	const darkMode = writable(defaultMode);
	const particlesEnabled = writable(true);

	function toggleDarkMode() {
		darkMode.update(c => {
	        localStorage.theme = c ? 'light' : 'dark';
	        return c = !c;
	    } );
	}

	function toggleParticles(){
	    particlesEnabled.update(b => {
	        return b = !b;
	    });
	}

	var particles = {
		number: {
			value: 60,
			density: {
				enable: true,
				value_area: 800
			}
		},
		color: {
			value: "#000"
		},
		shape: {
			type: "circle",
			stroke: {
				width: 0,
				color: "#000000"
			},
			polygon: {
				nb_sides: 5
			},
			image: {
				src: "img/github.svg",
				width: 100,
				height: 100
			}
		},
		opacity: {
			value: 0.5,
			random: false,
			anim: {
				enable: false,
				speed: 1,
				opacity_min: 0.1,
				sync: false
			}
		},
		size: {
			value: 5,
			random: true,
			anim: {
				enable: false,
				speed: 40,
				size_min: 0.1,
				sync: false
			}
		},
		line_linked: {
			enable: true,
			distance: 300,
			color: "#000",
			opacity: 0.4,
			width: 2
		},
		move: {
			enable: true,
			speed: 6,
			direction: "none",
			random: false,
			straight: false,
			out_mode: "out",
			bounce: false,
			attract: {
				enable: false,
				rotateX: 600,
				rotateY: 1200
			}
		}
	};
	var interactivity = {
		detect_on: "canvas",
		events: {
			onhover: {
				enable: true,
				mode: "repulse"
			},
			onclick: {
				enable: true,
				mode: "push"
			},
			resize: true
		},
		modes: {
			grab: {
				distance: 800,
				line_linked: {
					opacity: 1
				}
			},
			bubble: {
				distance: 800,
				size: 80,
				duration: 2,
				opacity: 0.8,
				speed: 3
			},
			repulse: {
				distance: 120,
				duration: 0.4
			},
			push: {
				particles_nb: 4
			},
			remove: {
				particles_nb: 2
			}
		}
	};
	var retina_detect = true;
	var particle_config = {
		particles: particles,
		interactivity: interactivity,
		retina_detect: retina_detect
	};

	var particleConfig = /*#__PURE__*/Object.freeze({
		__proto__: null,
		particles: particles,
		interactivity: interactivity,
		retina_detect: retina_detect,
		'default': particle_config
	});

	function $803c8d72044680d8$export$47684f97fe2830db(tag_id, params) {
	    var canvas_el = document.querySelector("#" + tag_id + " > .particles-js-canvas-el");
	    /* particles.js variables with default values */ this.pJS = {
	        canvas: {
	            el: canvas_el,
	            w: canvas_el.offsetWidth,
	            h: canvas_el.offsetHeight
	        },
	        particles: {
	            number: {
	                value: 400,
	                density: {
	                    enable: true,
	                    value_area: 800
	                }
	            },
	            color: {
	                value: "#fff"
	            },
	            shape: {
	                type: "circle",
	                stroke: {
	                    width: 0,
	                    color: "#ff0000"
	                },
	                polygon: {
	                    nb_sides: 5
	                },
	                image: {
	                    src: "",
	                    width: 100,
	                    height: 100
	                }
	            },
	            opacity: {
	                value: 1,
	                random: false,
	                anim: {
	                    enable: false,
	                    speed: 2,
	                    opacity_min: 0,
	                    sync: false
	                }
	            },
	            size: {
	                value: 20,
	                random: false,
	                anim: {
	                    enable: false,
	                    speed: 20,
	                    size_min: 0,
	                    sync: false
	                }
	            },
	            line_linked: {
	                enable: true,
	                distance: 100,
	                color: "#fff",
	                opacity: 1,
	                width: 1
	            },
	            move: {
	                enable: true,
	                speed: 2,
	                direction: "none",
	                random: false,
	                straight: false,
	                out_mode: "out",
	                bounce: false,
	                attract: {
	                    enable: false,
	                    rotateX: 3000,
	                    rotateY: 3000
	                }
	            },
	            array: []
	        },
	        interactivity: {
	            detect_on: "canvas",
	            events: {
	                onhover: {
	                    enable: true,
	                    mode: "grab"
	                },
	                onclick: {
	                    enable: true,
	                    mode: "push"
	                },
	                resize: true
	            },
	            modes: {
	                grab: {
	                    distance: 100,
	                    line_linked: {
	                        opacity: 1
	                    }
	                },
	                bubble: {
	                    distance: 200,
	                    size: 80,
	                    duration: 0.4
	                },
	                repulse: {
	                    distance: 200,
	                    duration: 0.4
	                },
	                push: {
	                    particles_nb: 4
	                },
	                remove: {
	                    particles_nb: 2
	                }
	            },
	            mouse: {}
	        },
	        retina_detect: false,
	        fn: {
	            interact: {},
	            modes: {},
	            vendors: {}
	        },
	        tmp: {}
	    };
	    var pJS1 = this.pJS;
	    /* params settings */ if (params) Object.deepExtend(pJS1, params);
	    pJS1.tmp.obj = {
	        size_value: pJS1.particles.size.value,
	        size_anim_speed: pJS1.particles.size.anim.speed,
	        move_speed: pJS1.particles.move.speed,
	        line_linked_distance: pJS1.particles.line_linked.distance,
	        line_linked_width: pJS1.particles.line_linked.width,
	        mode_grab_distance: pJS1.interactivity.modes.grab.distance,
	        mode_bubble_distance: pJS1.interactivity.modes.bubble.distance,
	        mode_bubble_size: pJS1.interactivity.modes.bubble.size,
	        mode_repulse_distance: pJS1.interactivity.modes.repulse.distance
	    };
	    pJS1.fn.retinaInit = function() {
	        if (pJS1.retina_detect && window.devicePixelRatio > 1) {
	            pJS1.canvas.pxratio = window.devicePixelRatio;
	            pJS1.tmp.retina = true;
	        } else {
	            pJS1.canvas.pxratio = 1;
	            pJS1.tmp.retina = false;
	        }
	        pJS1.canvas.w = pJS1.canvas.el.offsetWidth * pJS1.canvas.pxratio;
	        pJS1.canvas.h = pJS1.canvas.el.offsetHeight * pJS1.canvas.pxratio;
	        pJS1.particles.size.value = pJS1.tmp.obj.size_value * pJS1.canvas.pxratio;
	        pJS1.particles.size.anim.speed = pJS1.tmp.obj.size_anim_speed * pJS1.canvas.pxratio;
	        pJS1.particles.move.speed = pJS1.tmp.obj.move_speed * pJS1.canvas.pxratio;
	        pJS1.particles.line_linked.distance = pJS1.tmp.obj.line_linked_distance * pJS1.canvas.pxratio;
	        pJS1.interactivity.modes.grab.distance = pJS1.tmp.obj.mode_grab_distance * pJS1.canvas.pxratio;
	        pJS1.interactivity.modes.bubble.distance = pJS1.tmp.obj.mode_bubble_distance * pJS1.canvas.pxratio;
	        pJS1.particles.line_linked.width = pJS1.tmp.obj.line_linked_width * pJS1.canvas.pxratio;
	        pJS1.interactivity.modes.bubble.size = pJS1.tmp.obj.mode_bubble_size * pJS1.canvas.pxratio;
	        pJS1.interactivity.modes.repulse.distance = pJS1.tmp.obj.mode_repulse_distance * pJS1.canvas.pxratio;
	    };
	    /* ---------- pJS functions - canvas ------------ */ pJS1.fn.canvasInit = function() {
	        pJS1.canvas.ctx = pJS1.canvas.el.getContext("2d");
	    };
	    pJS1.fn.canvasSize = function() {
	        pJS1.canvas.el.width = pJS1.canvas.w;
	        pJS1.canvas.el.height = pJS1.canvas.h;
	        if (pJS1 && pJS1.interactivity.events.resize) window.addEventListener("resize", function() {
	            pJS1.canvas.w = pJS1.canvas.el.offsetWidth;
	            pJS1.canvas.h = pJS1.canvas.el.offsetHeight;
	            /* resize canvas */ if (pJS1.tmp.retina) {
	                pJS1.canvas.w *= pJS1.canvas.pxratio;
	                pJS1.canvas.h *= pJS1.canvas.pxratio;
	            }
	            pJS1.canvas.el.width = pJS1.canvas.w;
	            pJS1.canvas.el.height = pJS1.canvas.h;
	            /* repaint canvas on anim disabled */ if (!pJS1.particles.move.enable) {
	                pJS1.fn.particlesEmpty();
	                pJS1.fn.particlesCreate();
	                pJS1.fn.particlesDraw();
	                pJS1.fn.vendors.densityAutoParticles();
	            }
	            /* density particles enabled */ pJS1.fn.vendors.densityAutoParticles();
	        });
	    };
	    pJS1.fn.canvasPaint = function() {
	        pJS1.canvas.ctx.fillRect(0, 0, pJS1.canvas.w, pJS1.canvas.h);
	    };
	    pJS1.fn.canvasClear = function() {
	        pJS1.canvas.ctx.clearRect(0, 0, pJS1.canvas.w, pJS1.canvas.h);
	    };
	    /* --------- pJS functions - particles ----------- */ pJS1.fn.particle = function(color, opacity, position) {
	        /* size */ this.radius = (pJS1.particles.size.random ? Math.random() : 1) * pJS1.particles.size.value;
	        if (pJS1.particles.size.anim.enable) {
	            this.size_status = false;
	            this.vs = pJS1.particles.size.anim.speed / 100;
	            if (!pJS1.particles.size.anim.sync) this.vs = this.vs * Math.random();
	        }
	        /* position */ this.x = position ? position.x : Math.random() * pJS1.canvas.w;
	        this.y = position ? position.y : Math.random() * pJS1.canvas.h;
	        /* check position  - into the canvas */ if (this.x > pJS1.canvas.w - this.radius * 2) this.x = this.x - this.radius;
	        else if (this.x < this.radius * 2) this.x = this.x + this.radius;
	        if (this.y > pJS1.canvas.h - this.radius * 2) this.y = this.y - this.radius;
	        else if (this.y < this.radius * 2) this.y = this.y + this.radius;
	        /* check position - avoid overlap */ if (pJS1.particles.move.bounce) pJS1.fn.vendors.checkOverlap(this, position);
	        /* color */ this.color = {};
	        if (typeof color.value == "object") {
	            if (color.value instanceof Array) {
	                var color_selected = color.value[Math.floor(Math.random() * pJS1.particles.color.value.length)];
	                this.color.rgb = $803c8d72044680d8$var$hexToRgb(color_selected);
	            } else {
	                if (color.value.r != undefined && color.value.g != undefined && color.value.b != undefined) this.color.rgb = {
	                    r: color.value.r,
	                    g: color.value.g,
	                    b: color.value.b
	                };
	                if (color.value.h != undefined && color.value.s != undefined && color.value.l != undefined) this.color.hsl = {
	                    h: color.value.h,
	                    s: color.value.s,
	                    l: color.value.l
	                };
	            }
	        } else if (color.value == "random") this.color.rgb = {
	            r: Math.floor(Math.random() * 256) + 0,
	            g: Math.floor(Math.random() * 256) + 0,
	            b: Math.floor(Math.random() * 256) + 0
	        };
	        else if (typeof color.value == "string") {
	            this.color = color;
	            this.color.rgb = $803c8d72044680d8$var$hexToRgb(this.color.value);
	        }
	        /* opacity */ this.opacity = (pJS1.particles.opacity.random ? Math.random() : 1) * pJS1.particles.opacity.value;
	        if (pJS1.particles.opacity.anim.enable) {
	            this.opacity_status = false;
	            this.vo = pJS1.particles.opacity.anim.speed / 100;
	            if (!pJS1.particles.opacity.anim.sync) this.vo = this.vo * Math.random();
	        }
	        /* animation - velocity for speed */ var velbase = {};
	        switch(pJS1.particles.move.direction){
	            case "top":
	                velbase = {
	                    x: 0,
	                    y: -1
	                };
	                break;
	            case "top-right":
	                velbase = {
	                    x: 0.5,
	                    y: -0.5
	                };
	                break;
	            case "right":
	                velbase = {
	                    x: 1,
	                    y: -0
	                };
	                break;
	            case "bottom-right":
	                velbase = {
	                    x: 0.5,
	                    y: 0.5
	                };
	                break;
	            case "bottom":
	                velbase = {
	                    x: 0,
	                    y: 1
	                };
	                break;
	            case "bottom-left":
	                velbase = {
	                    x: -0.5,
	                    y: 1
	                };
	                break;
	            case "left":
	                velbase = {
	                    x: -1,
	                    y: 0
	                };
	                break;
	            case "top-left":
	                velbase = {
	                    x: -0.5,
	                    y: -0.5
	                };
	                break;
	            default:
	                velbase = {
	                    x: 0,
	                    y: 0
	                };
	                break;
	        }
	        if (pJS1.particles.move.straight) {
	            this.vx = velbase.x;
	            this.vy = velbase.y;
	            if (pJS1.particles.move.random) {
	                this.vx = this.vx * Math.random();
	                this.vy = this.vy * Math.random();
	            }
	        } else {
	            this.vx = velbase.x + Math.random() - 0.5;
	            this.vy = velbase.y + Math.random() - 0.5;
	        }
	        // var theta = 2.0 * Math.PI * Math.random();
	        // this.vx = Math.cos(theta);
	        // this.vy = Math.sin(theta);
	        this.vx_i = this.vx;
	        this.vy_i = this.vy;
	        /* if shape is image */ var shape_type = pJS1.particles.shape.type;
	        if (typeof shape_type == "object") {
	            if (shape_type instanceof Array) {
	                var shape_selected = shape_type[Math.floor(Math.random() * shape_type.length)];
	                this.shape = shape_selected;
	            }
	        } else this.shape = shape_type;
	        if (this.shape == "image") {
	            var sh = pJS1.particles.shape;
	            this.img = {
	                src: sh.image.src,
	                ratio: sh.image.width / sh.image.height
	            };
	            if (!this.img.ratio) this.img.ratio = 1;
	            if (pJS1.tmp.img_type == "svg" && pJS1.tmp.source_svg != undefined) {
	                pJS1.fn.vendors.createSvgImg(this);
	                if (pJS1.tmp.pushing) this.img.loaded = false;
	            }
	        }
	    };
	    pJS1.fn.particle.prototype.draw = function() {
	        var p = this;
	        if (p.radius_bubble != undefined) var radius = p.radius_bubble;
	        else var radius = p.radius;
	        if (p.opacity_bubble != undefined) var opacity = p.opacity_bubble;
	        else var opacity = p.opacity;
	        if (p.color.rgb) var color_value = "rgba(" + p.color.rgb.r + "," + p.color.rgb.g + "," + p.color.rgb.b + "," + opacity + ")";
	        else var color_value = "hsla(" + p.color.hsl.h + "," + p.color.hsl.s + "%," + p.color.hsl.l + "%," + opacity + ")";
	        pJS1.canvas.ctx.fillStyle = color_value;
	        pJS1.canvas.ctx.beginPath();
	        switch(p.shape){
	            case "circle":
	                pJS1.canvas.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2, false);
	                break;
	            case "edge":
	                pJS1.canvas.ctx.rect(p.x - radius, p.y - radius, radius * 2, radius * 2);
	                break;
	            case "triangle":
	                pJS1.fn.vendors.drawShape(pJS1.canvas.ctx, p.x - radius, p.y + radius / 1.66, radius * 2, 3, 2);
	                break;
	            case "polygon":
	                pJS1.fn.vendors.drawShape(pJS1.canvas.ctx, p.x - radius / (pJS1.particles.shape.polygon.nb_sides / 3.5), p.y - radius / 0.76, radius * 2.66 / (pJS1.particles.shape.polygon.nb_sides / 3), pJS1.particles.shape.polygon.nb_sides, 1 // sideCountDenominator
	                );
	                break;
	            case "star":
	                pJS1.fn.vendors.drawShape(pJS1.canvas.ctx, p.x - radius * 2 / (pJS1.particles.shape.polygon.nb_sides / 4), p.y - radius / 1.52, radius * 5.32 / (pJS1.particles.shape.polygon.nb_sides / 3), pJS1.particles.shape.polygon.nb_sides, 2 // sideCountDenominator
	                );
	                break;
	            case "image":
	                function draw() {
	                    pJS1.canvas.ctx.drawImage(img_obj, p.x - radius, p.y - radius, radius * 2, radius * 2 / p.img.ratio);
	                }
	                if (pJS1.tmp.img_type == "svg") var img_obj = p.img.obj;
	                else var img_obj = pJS1.tmp.img_obj;
	                if (img_obj) draw();
	                break;
	        }
	        pJS1.canvas.ctx.closePath();
	        if (pJS1.particles.shape.stroke.width > 0) {
	            pJS1.canvas.ctx.strokeStyle = pJS1.particles.shape.stroke.color;
	            pJS1.canvas.ctx.lineWidth = pJS1.particles.shape.stroke.width;
	            pJS1.canvas.ctx.stroke();
	        }
	        pJS1.canvas.ctx.fill();
	    };
	    pJS1.fn.particlesCreate = function() {
	        for(var i = 0; i < pJS1.particles.number.value; i++)pJS1.particles.array.push(new pJS1.fn.particle(pJS1.particles.color, pJS1.particles.opacity.value));
	    };
	    pJS1.fn.particlesUpdate = function() {
	        for(var i = 0; i < pJS1.particles.array.length; i++){
	            /* the particle */ var p = pJS1.particles.array[i];
	            // var d = ( dx = pJS.interactivity.mouse.click_pos_x - p.x ) * dx + ( dy = pJS.interactivity.mouse.click_pos_y - p.y ) * dy;
	            // var f = -BANG_SIZE / d;
	            // if ( d < BANG_SIZE ) {
	            //     var t = Math.atan2( dy, dx );
	            //     p.vx = f * Math.cos(t);
	            //     p.vy = f * Math.sin(t);
	            // }
	            /* move the particle */ if (pJS1.particles.move.enable) {
	                var ms = pJS1.particles.move.speed / 2;
	                p.x += p.vx * ms;
	                p.y += p.vy * ms;
	            }
	            /* change opacity status */ if (pJS1.particles.opacity.anim.enable) {
	                if (p.opacity_status == true) {
	                    if (p.opacity >= pJS1.particles.opacity.value) p.opacity_status = false;
	                    p.opacity += p.vo;
	                } else {
	                    if (p.opacity <= pJS1.particles.opacity.anim.opacity_min) p.opacity_status = true;
	                    p.opacity -= p.vo;
	                }
	                if (p.opacity < 0) p.opacity = 0;
	            }
	            /* change size */ if (pJS1.particles.size.anim.enable) {
	                if (p.size_status == true) {
	                    if (p.radius >= pJS1.particles.size.value) p.size_status = false;
	                    p.radius += p.vs;
	                } else {
	                    if (p.radius <= pJS1.particles.size.anim.size_min) p.size_status = true;
	                    p.radius -= p.vs;
	                }
	                if (p.radius < 0) p.radius = 0;
	            }
	            /* change particle position if it is out of canvas */ if (pJS1.particles.move.out_mode == "bounce") var new_pos = {
	                x_left: p.radius,
	                x_right: pJS1.canvas.w,
	                y_top: p.radius,
	                y_bottom: pJS1.canvas.h
	            };
	            else var new_pos = {
	                x_left: -p.radius,
	                x_right: pJS1.canvas.w + p.radius,
	                y_top: -p.radius,
	                y_bottom: pJS1.canvas.h + p.radius
	            };
	            if (p.x - p.radius > pJS1.canvas.w) {
	                p.x = new_pos.x_left;
	                p.y = Math.random() * pJS1.canvas.h;
	            } else if (p.x + p.radius < 0) {
	                p.x = new_pos.x_right;
	                p.y = Math.random() * pJS1.canvas.h;
	            }
	            if (p.y - p.radius > pJS1.canvas.h) {
	                p.y = new_pos.y_top;
	                p.x = Math.random() * pJS1.canvas.w;
	            } else if (p.y + p.radius < 0) {
	                p.y = new_pos.y_bottom;
	                p.x = Math.random() * pJS1.canvas.w;
	            }
	            /* out of canvas modes */ switch(pJS1.particles.move.out_mode){
	                case "bounce":
	                    if (p.x + p.radius > pJS1.canvas.w) p.vx = -p.vx;
	                    else if (p.x - p.radius < 0) p.vx = -p.vx;
	                    if (p.y + p.radius > pJS1.canvas.h) p.vy = -p.vy;
	                    else if (p.y - p.radius < 0) p.vy = -p.vy;
	                    break;
	            }
	            /* events */ if ($803c8d72044680d8$var$isInArray("grab", pJS1.interactivity.events.onhover.mode)) pJS1.fn.modes.grabParticle(p);
	            if ($803c8d72044680d8$var$isInArray("bubble", pJS1.interactivity.events.onhover.mode) || $803c8d72044680d8$var$isInArray("bubble", pJS1.interactivity.events.onclick.mode)) pJS1.fn.modes.bubbleParticle(p);
	            if ($803c8d72044680d8$var$isInArray("repulse", pJS1.interactivity.events.onhover.mode) || $803c8d72044680d8$var$isInArray("repulse", pJS1.interactivity.events.onclick.mode)) pJS1.fn.modes.repulseParticle(p);
	            /* interaction auto between particles */ if (pJS1.particles.line_linked.enable || pJS1.particles.move.attract.enable) for(var j = i + 1; j < pJS1.particles.array.length; j++){
	                var p2 = pJS1.particles.array[j];
	                /* link particles */ if (pJS1.particles.line_linked.enable) pJS1.fn.interact.linkParticles(p, p2);
	                /* attract particles */ if (pJS1.particles.move.attract.enable) pJS1.fn.interact.attractParticles(p, p2);
	                /* bounce particles */ if (pJS1.particles.move.bounce) pJS1.fn.interact.bounceParticles(p, p2);
	            }
	        }
	    };
	    pJS1.fn.particlesDraw = function() {
	        /* clear canvas */ pJS1.canvas.ctx.clearRect(0, 0, pJS1.canvas.w, pJS1.canvas.h);
	        /* update each particles param */ pJS1.fn.particlesUpdate();
	        /* draw each particle */ for(var i = 0; i < pJS1.particles.array.length; i++){
	            var p = pJS1.particles.array[i];
	            p.draw();
	        }
	    };
	    pJS1.fn.particlesEmpty = function() {
	        pJS1.particles.array = [];
	    };
	    pJS1.fn.particlesRefresh = function() {
	        /* init all */ $803c8d72044680d8$var$cancelRequestAnimFrame(pJS1.fn.checkAnimFrame);
	        $803c8d72044680d8$var$cancelRequestAnimFrame(pJS1.fn.drawAnimFrame);
	        pJS1.tmp.source_svg = undefined;
	        pJS1.tmp.img_obj = undefined;
	        pJS1.tmp.count_svg = 0;
	        pJS1.fn.particlesEmpty();
	        pJS1.fn.canvasClear();
	        /* restart */ pJS1.fn.vendors.start();
	    };
	    /* ---------- pJS functions - particles interaction ------------ */ pJS1.fn.interact.linkParticles = function(p1, p2) {
	        var dx = p1.x - p2.x, dy = p1.y - p2.y, dist = Math.sqrt(dx * dx + dy * dy);
	        /* draw a line between p1 and p2 if the distance between them is under the config distance */ if (dist <= pJS1.particles.line_linked.distance) {
	            var opacity_line = pJS1.particles.line_linked.opacity - dist / (1 / pJS1.particles.line_linked.opacity) / pJS1.particles.line_linked.distance;
	            if (opacity_line > 0) {
	                /* style */ var color_line = pJS1.particles.line_linked.color_rgb_line;
	                pJS1.canvas.ctx.strokeStyle = "rgba(" + color_line.r + "," + color_line.g + "," + color_line.b + "," + opacity_line + ")";
	                pJS1.canvas.ctx.lineWidth = pJS1.particles.line_linked.width;
	                //pJS.canvas.ctx.lineCap = 'round'; /* performance issue */
	                /* path */ pJS1.canvas.ctx.beginPath();
	                pJS1.canvas.ctx.moveTo(p1.x, p1.y);
	                pJS1.canvas.ctx.lineTo(p2.x, p2.y);
	                pJS1.canvas.ctx.stroke();
	                pJS1.canvas.ctx.closePath();
	            }
	        }
	    };
	    pJS1.fn.interact.attractParticles = function(p1, p2) {
	        /* condensed particles */ var dx = p1.x - p2.x, dy = p1.y - p2.y, dist = Math.sqrt(dx * dx + dy * dy);
	        if (dist <= pJS1.particles.line_linked.distance) {
	            var ax = dx / (pJS1.particles.move.attract.rotateX * 1000), ay = dy / (pJS1.particles.move.attract.rotateY * 1000);
	            p1.vx -= ax;
	            p1.vy -= ay;
	            p2.vx += ax;
	            p2.vy += ay;
	        }
	    };
	    pJS1.fn.interact.bounceParticles = function(p1, p2) {
	        var dx = p1.x - p2.x, dy = p1.y - p2.y, dist = Math.sqrt(dx * dx + dy * dy), dist_p = p1.radius + p2.radius;
	        if (dist <= dist_p) {
	            p1.vx = -p1.vx;
	            p1.vy = -p1.vy;
	            p2.vx = -p2.vx;
	            p2.vy = -p2.vy;
	        }
	    };
	    /* ---------- pJS functions - modes events ------------ */ pJS1.fn.modes.pushParticles = function(nb, pos) {
	        pJS1.tmp.pushing = true;
	        for(var i = 0; i < nb; i++){
	            pJS1.particles.array.push(new pJS1.fn.particle(pJS1.particles.color, pJS1.particles.opacity.value, {
	                "x": pos ? pos.pos_x : Math.random() * pJS1.canvas.w,
	                "y": pos ? pos.pos_y : Math.random() * pJS1.canvas.h
	            }));
	            if (i == nb - 1) {
	                if (!pJS1.particles.move.enable) pJS1.fn.particlesDraw();
	                pJS1.tmp.pushing = false;
	            }
	        }
	    };
	    pJS1.fn.modes.removeParticles = function(nb) {
	        pJS1.particles.array.splice(0, nb);
	        if (!pJS1.particles.move.enable) pJS1.fn.particlesDraw();
	    };
	    pJS1.fn.modes.bubbleParticle = function(p) {
	        /* on hover event */ if (pJS1.interactivity.events.onhover.enable && $803c8d72044680d8$var$isInArray("bubble", pJS1.interactivity.events.onhover.mode)) {
	            var dx_mouse = p.x - pJS1.interactivity.mouse.pos_x, dy_mouse = p.y - pJS1.interactivity.mouse.pos_y, dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse), ratio = 1 - dist_mouse / pJS1.interactivity.modes.bubble.distance;
	            function init() {
	                p.opacity_bubble = p.opacity;
	                p.radius_bubble = p.radius;
	            }
	            /* mousemove - check ratio */ if (dist_mouse <= pJS1.interactivity.modes.bubble.distance) {
	                if (ratio >= 0 && pJS1.interactivity.status == "mousemove") {
	                    /* size */ if (pJS1.interactivity.modes.bubble.size != pJS1.particles.size.value) {
	                        if (pJS1.interactivity.modes.bubble.size > pJS1.particles.size.value) {
	                            var size = p.radius + pJS1.interactivity.modes.bubble.size * ratio;
	                            if (size >= 0) p.radius_bubble = size;
	                        } else {
	                            var dif = p.radius - pJS1.interactivity.modes.bubble.size, size = p.radius - dif * ratio;
	                            if (size > 0) p.radius_bubble = size;
	                            else p.radius_bubble = 0;
	                        }
	                    }
	                    /* opacity */ if (pJS1.interactivity.modes.bubble.opacity != pJS1.particles.opacity.value) {
	                        if (pJS1.interactivity.modes.bubble.opacity > pJS1.particles.opacity.value) {
	                            var opacity = pJS1.interactivity.modes.bubble.opacity * ratio;
	                            if (opacity > p.opacity && opacity <= pJS1.interactivity.modes.bubble.opacity) p.opacity_bubble = opacity;
	                        } else {
	                            var opacity = p.opacity - (pJS1.particles.opacity.value - pJS1.interactivity.modes.bubble.opacity) * ratio;
	                            if (opacity < p.opacity && opacity >= pJS1.interactivity.modes.bubble.opacity) p.opacity_bubble = opacity;
	                        }
	                    }
	                }
	            } else init();
	            /* mouseleave */ if (pJS1.interactivity.status == "mouseleave") init();
	        } else if (pJS1.interactivity.events.onclick.enable && $803c8d72044680d8$var$isInArray("bubble", pJS1.interactivity.events.onclick.mode)) {
	            if (pJS1.tmp.bubble_clicking) {
	                var dx_mouse = p.x - pJS1.interactivity.mouse.click_pos_x, dy_mouse = p.y - pJS1.interactivity.mouse.click_pos_y, dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse), time_spent = (new Date().getTime() - pJS1.interactivity.mouse.click_time) / 1000;
	                if (time_spent > pJS1.interactivity.modes.bubble.duration) pJS1.tmp.bubble_duration_end = true;
	                if (time_spent > pJS1.interactivity.modes.bubble.duration * 2) {
	                    pJS1.tmp.bubble_clicking = false;
	                    pJS1.tmp.bubble_duration_end = false;
	                }
	            }
	            function process(bubble_param, particles_param, p_obj_bubble, p_obj, id) {
	                if (bubble_param != particles_param) {
	                    if (!pJS1.tmp.bubble_duration_end) {
	                        if (dist_mouse <= pJS1.interactivity.modes.bubble.distance) {
	                            if (p_obj_bubble != undefined) var obj = p_obj_bubble;
	                            else var obj = p_obj;
	                            if (obj != bubble_param) {
	                                var value = p_obj - time_spent * (p_obj - bubble_param) / pJS1.interactivity.modes.bubble.duration;
	                                if (id == "size") p.radius_bubble = value;
	                                if (id == "opacity") p.opacity_bubble = value;
	                            }
	                        } else {
	                            if (id == "size") p.radius_bubble = undefined;
	                            if (id == "opacity") p.opacity_bubble = undefined;
	                        }
	                    } else if (p_obj_bubble != undefined) {
	                        var value_tmp = p_obj - time_spent * (p_obj - bubble_param) / pJS1.interactivity.modes.bubble.duration, dif = bubble_param - value_tmp;
	                        value = bubble_param + dif;
	                        if (id == "size") p.radius_bubble = value;
	                        if (id == "opacity") p.opacity_bubble = value;
	                    }
	                }
	            }
	            if (pJS1.tmp.bubble_clicking) {
	                /* size */ process(pJS1.interactivity.modes.bubble.size, pJS1.particles.size.value, p.radius_bubble, p.radius, "size");
	                /* opacity */ process(pJS1.interactivity.modes.bubble.opacity, pJS1.particles.opacity.value, p.opacity_bubble, p.opacity, "opacity");
	            }
	        }
	    };
	    pJS1.fn.modes.repulseParticle = function(p) {
	        if (pJS1.interactivity.events.onhover.enable && $803c8d72044680d8$var$isInArray("repulse", pJS1.interactivity.events.onhover.mode) && pJS1.interactivity.status == "mousemove") {
	            var dx_mouse = p.x - pJS1.interactivity.mouse.pos_x, dy_mouse = p.y - pJS1.interactivity.mouse.pos_y, dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
	            var normVec = {
	                x: dx_mouse / dist_mouse,
	                y: dy_mouse / dist_mouse
	            }, repulseRadius = pJS1.interactivity.modes.repulse.distance, velocity = 100, repulseFactor = $803c8d72044680d8$var$clamp(1 / repulseRadius * (-1 * Math.pow(dist_mouse / repulseRadius, 2) + 1) * repulseRadius * velocity, 0, 50);
	            var pos = {
	                x: p.x + normVec.x * repulseFactor,
	                y: p.y + normVec.y * repulseFactor
	            };
	            if (pJS1.particles.move.out_mode == "bounce") {
	                if (pos.x - p.radius > 0 && pos.x + p.radius < pJS1.canvas.w) p.x = pos.x;
	                if (pos.y - p.radius > 0 && pos.y + p.radius < pJS1.canvas.h) p.y = pos.y;
	            } else {
	                p.x = pos.x;
	                p.y = pos.y;
	            }
	        } else if (pJS1.interactivity.events.onclick.enable && $803c8d72044680d8$var$isInArray("repulse", pJS1.interactivity.events.onclick.mode)) {
	            if (!pJS1.tmp.repulse_finish) {
	                pJS1.tmp.repulse_count++;
	                if (pJS1.tmp.repulse_count == pJS1.particles.array.length) pJS1.tmp.repulse_finish = true;
	            }
	            if (pJS1.tmp.repulse_clicking) {
	                var repulseRadius = Math.pow(pJS1.interactivity.modes.repulse.distance / 6, 3);
	                var dx = pJS1.interactivity.mouse.click_pos_x - p.x, dy = pJS1.interactivity.mouse.click_pos_y - p.y, d = dx * dx + dy * dy;
	                var force = -repulseRadius / d * 1;
	                function process() {
	                    var f = Math.atan2(dy, dx);
	                    p.vx = force * Math.cos(f);
	                    p.vy = force * Math.sin(f);
	                    if (pJS1.particles.move.out_mode == "bounce") {
	                        var pos = {
	                            x: p.x + p.vx,
	                            y: p.y + p.vy
	                        };
	                        if (pos.x + p.radius > pJS1.canvas.w) p.vx = -p.vx;
	                        else if (pos.x - p.radius < 0) p.vx = -p.vx;
	                        if (pos.y + p.radius > pJS1.canvas.h) p.vy = -p.vy;
	                        else if (pos.y - p.radius < 0) p.vy = -p.vy;
	                    }
	                }
	                // default
	                if (d <= repulseRadius) process();
	            // bang - slow motion mode
	            // if(!pJS.tmp.repulse_finish){
	            //   if(d <= repulseRadius){
	            //     process();
	            //   }
	            // }else{
	            //   process();
	            // }
	            } else if (pJS1.tmp.repulse_clicking == false) {
	                p.vx = p.vx_i;
	                p.vy = p.vy_i;
	            }
	        }
	    };
	    pJS1.fn.modes.grabParticle = function(p) {
	        if (pJS1.interactivity.events.onhover.enable && pJS1.interactivity.status == "mousemove") {
	            var dx_mouse = p.x - pJS1.interactivity.mouse.pos_x, dy_mouse = p.y - pJS1.interactivity.mouse.pos_y, dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
	            /* draw a line between the cursor and the particle if the distance between them is under the config distance */ if (dist_mouse <= pJS1.interactivity.modes.grab.distance) {
	                var opacity_line = pJS1.interactivity.modes.grab.line_linked.opacity - dist_mouse / (1 / pJS1.interactivity.modes.grab.line_linked.opacity) / pJS1.interactivity.modes.grab.distance;
	                if (opacity_line > 0) {
	                    /* style */ var color_line = pJS1.particles.line_linked.color_rgb_line;
	                    pJS1.canvas.ctx.strokeStyle = "rgba(" + color_line.r + "," + color_line.g + "," + color_line.b + "," + opacity_line + ")";
	                    pJS1.canvas.ctx.lineWidth = pJS1.particles.line_linked.width;
	                    //pJS.canvas.ctx.lineCap = 'round'; /* performance issue */
	                    /* path */ pJS1.canvas.ctx.beginPath();
	                    pJS1.canvas.ctx.moveTo(p.x, p.y);
	                    pJS1.canvas.ctx.lineTo(pJS1.interactivity.mouse.pos_x, pJS1.interactivity.mouse.pos_y);
	                    pJS1.canvas.ctx.stroke();
	                    pJS1.canvas.ctx.closePath();
	                }
	            }
	        }
	    };
	    /* ---------- pJS functions - vendors ------------ */ pJS1.fn.vendors.eventsListeners = function() {
	        /* events target element */ if (pJS1.interactivity.detect_on == "window") pJS1.interactivity.el = window;
	        else pJS1.interactivity.el = pJS1.canvas.el;
	        /* detect mouse pos - on hover / click event */ if (pJS1.interactivity.events.onhover.enable || pJS1.interactivity.events.onclick.enable) {
	            /* el on mousemove */ pJS1.interactivity.el.addEventListener("mousemove", function(e) {
	                if (pJS1.interactivity.el == window) var pos_x = e.clientX, pos_y = e.clientY;
	                else var pos_x = e.offsetX || e.clientX, pos_y = e.offsetY || e.clientY;
	                pJS1.interactivity.mouse.pos_x = pos_x;
	                pJS1.interactivity.mouse.pos_y = pos_y;
	                if (pJS1.tmp.retina) {
	                    pJS1.interactivity.mouse.pos_x *= pJS1.canvas.pxratio;
	                    pJS1.interactivity.mouse.pos_y *= pJS1.canvas.pxratio;
	                }
	                pJS1.interactivity.status = "mousemove";
	            });
	            /* el on onmouseleave */ pJS1.interactivity.el.addEventListener("mouseleave", function(e) {
	                pJS1.interactivity.mouse.pos_x = null;
	                pJS1.interactivity.mouse.pos_y = null;
	                pJS1.interactivity.status = "mouseleave";
	            });
	        }
	        /* on click event */ if (pJS1.interactivity.events.onclick.enable) pJS1.interactivity.el.addEventListener("click", function() {
	            pJS1.interactivity.mouse.click_pos_x = pJS1.interactivity.mouse.pos_x;
	            pJS1.interactivity.mouse.click_pos_y = pJS1.interactivity.mouse.pos_y;
	            pJS1.interactivity.mouse.click_time = new Date().getTime();
	            if (pJS1.interactivity.events.onclick.enable) switch(pJS1.interactivity.events.onclick.mode){
	                case "push":
	                    if (pJS1.particles.move.enable) pJS1.fn.modes.pushParticles(pJS1.interactivity.modes.push.particles_nb, pJS1.interactivity.mouse);
	                    else {
	                        if (pJS1.interactivity.modes.push.particles_nb == 1) pJS1.fn.modes.pushParticles(pJS1.interactivity.modes.push.particles_nb, pJS1.interactivity.mouse);
	                        else if (pJS1.interactivity.modes.push.particles_nb > 1) pJS1.fn.modes.pushParticles(pJS1.interactivity.modes.push.particles_nb);
	                    }
	                    break;
	                case "remove":
	                    pJS1.fn.modes.removeParticles(pJS1.interactivity.modes.remove.particles_nb);
	                    break;
	                case "bubble":
	                    pJS1.tmp.bubble_clicking = true;
	                    break;
	                case "repulse":
	                    pJS1.tmp.repulse_clicking = true;
	                    pJS1.tmp.repulse_count = 0;
	                    pJS1.tmp.repulse_finish = false;
	                    setTimeout(function() {
	                        pJS1.tmp.repulse_clicking = false;
	                    }, pJS1.interactivity.modes.repulse.duration * 1000);
	                    break;
	            }
	        });
	    };
	    pJS1.fn.vendors.densityAutoParticles = function() {
	        if (pJS1.particles.number.density.enable) {
	            /* calc area */ var area = pJS1.canvas.el.width * pJS1.canvas.el.height / 1000;
	            if (pJS1.tmp.retina) area = area / (pJS1.canvas.pxratio * 2);
	            /* calc number of particles based on density area */ var nb_particles = area * pJS1.particles.number.value / pJS1.particles.number.density.value_area;
	            /* add or remove X particles */ var missing_particles = pJS1.particles.array.length - nb_particles;
	            if (missing_particles < 0) pJS1.fn.modes.pushParticles(Math.abs(missing_particles));
	            else pJS1.fn.modes.removeParticles(missing_particles);
	        }
	    };
	    pJS1.fn.vendors.checkOverlap = function(p1, position) {
	        for(var i = 0; i < pJS1.particles.array.length; i++){
	            var p2 = pJS1.particles.array[i];
	            var dx = p1.x - p2.x, dy = p1.y - p2.y, dist = Math.sqrt(dx * dx + dy * dy);
	            if (dist <= p1.radius + p2.radius) {
	                p1.x = position ? position.x : Math.random() * pJS1.canvas.w;
	                p1.y = position ? position.y : Math.random() * pJS1.canvas.h;
	                pJS1.fn.vendors.checkOverlap(p1);
	            }
	        }
	    };
	    pJS1.fn.vendors.createSvgImg = function(p) {
	        /* set color to svg element */ var svgXml = pJS1.tmp.source_svg, rgbHex = /#([0-9A-F]{3,6})/gi, coloredSvgXml = svgXml.replace(rgbHex, function(m, r, g, b) {
	            if (p.color.rgb) var color_value = "rgba(" + p.color.rgb.r + "," + p.color.rgb.g + "," + p.color.rgb.b + "," + p.opacity + ")";
	            else var color_value = "hsla(" + p.color.hsl.h + "," + p.color.hsl.s + "%," + p.color.hsl.l + "%," + p.opacity + ")";
	            return color_value;
	        });
	        /* prepare to create img with colored svg */ var svg = new Blob([
	            coloredSvgXml
	        ], {
	            type: "image/svg+xml;charset=utf-8"
	        }), DOMURL = window.URL || window.webkitURL || window, url = DOMURL.createObjectURL(svg);
	        /* create particle img obj */ var img = new Image();
	        img.addEventListener("load", function() {
	            p.img.obj = img;
	            p.img.loaded = true;
	            DOMURL.revokeObjectURL(url);
	            pJS1.tmp.count_svg++;
	        });
	        img.src = url;
	    };
	    pJS1.fn.vendors.destroypJS = function() {
	        cancelAnimationFrame(pJS1.fn.drawAnimFrame);
	        canvas_el.remove();
	        $803c8d72044680d8$export$133e7c9a2a8d0ed8 = null;
	    };
	    pJS1.fn.vendors.drawShape = function(c, startX, startY, sideLength, sideCountNumerator, sideCountDenominator) {
	        // By Programming Thomas - https://programmingthomas.wordpress.com/2013/04/03/n-sided-shapes/
	        var sideCount = sideCountNumerator * sideCountDenominator;
	        var decimalSides = sideCountNumerator / sideCountDenominator;
	        var interiorAngleDegrees = 180 * (decimalSides - 2) / decimalSides;
	        var interiorAngle = Math.PI - Math.PI * interiorAngleDegrees / 180; // convert to radians
	        c.save();
	        c.beginPath();
	        c.translate(startX, startY);
	        c.moveTo(0, 0);
	        for(var i = 0; i < sideCount; i++){
	            c.lineTo(sideLength, 0);
	            c.translate(sideLength, 0);
	            c.rotate(interiorAngle);
	        }
	        //c.stroke();
	        c.fill();
	        c.restore();
	    };
	    pJS1.fn.vendors.exportImg = function() {
	        window.open(pJS1.canvas.el.toDataURL("image/png"), "_blank");
	    };
	    pJS1.fn.vendors.loadImg = function(type) {
	        pJS1.tmp.img_error = undefined;
	        if (pJS1.particles.shape.image.src != "") {
	            if (type == "svg") {
	                var xhr = new XMLHttpRequest();
	                xhr.open("GET", pJS1.particles.shape.image.src);
	                xhr.onreadystatechange = function(data) {
	                    if (xhr.readyState == 4) {
	                        if (xhr.status == 200) {
	                            pJS1.tmp.source_svg = data.currentTarget.response;
	                            pJS1.fn.vendors.checkBeforeDraw();
	                        } else {
	                            console.log("Error pJS - Image not found");
	                            pJS1.tmp.img_error = true;
	                        }
	                    }
	                };
	                xhr.send();
	            } else {
	                var img = new Image();
	                img.addEventListener("load", function() {
	                    pJS1.tmp.img_obj = img;
	                    pJS1.fn.vendors.checkBeforeDraw();
	                });
	                img.src = pJS1.particles.shape.image.src;
	            }
	        } else {
	            console.log("Error pJS - No image.src");
	            pJS1.tmp.img_error = true;
	        }
	    };
	    pJS1.fn.vendors.draw = function() {
	        if (pJS1.particles.shape.type == "image") {
	            if (pJS1.tmp.img_type == "svg") {
	                if (pJS1.tmp.count_svg >= pJS1.particles.number.value) {
	                    pJS1.fn.particlesDraw();
	                    if (!pJS1.particles.move.enable) $803c8d72044680d8$var$cancelRequestAnimFrame(pJS1.fn.drawAnimFrame);
	                    else pJS1.fn.drawAnimFrame = $803c8d72044680d8$var$requestAnimFrame(pJS1.fn.vendors.draw);
	                } else //console.log('still loading...');
	                if (!pJS1.tmp.img_error) pJS1.fn.drawAnimFrame = $803c8d72044680d8$var$requestAnimFrame(pJS1.fn.vendors.draw);
	            } else {
	                if (pJS1.tmp.img_obj != undefined) {
	                    pJS1.fn.particlesDraw();
	                    if (!pJS1.particles.move.enable) $803c8d72044680d8$var$cancelRequestAnimFrame(pJS1.fn.drawAnimFrame);
	                    else pJS1.fn.drawAnimFrame = $803c8d72044680d8$var$requestAnimFrame(pJS1.fn.vendors.draw);
	                } else if (!pJS1.tmp.img_error) pJS1.fn.drawAnimFrame = $803c8d72044680d8$var$requestAnimFrame(pJS1.fn.vendors.draw);
	            }
	        } else {
	            pJS1.fn.particlesDraw();
	            if (!pJS1.particles.move.enable) $803c8d72044680d8$var$cancelRequestAnimFrame(pJS1.fn.drawAnimFrame);
	            else pJS1.fn.drawAnimFrame = $803c8d72044680d8$var$requestAnimFrame(pJS1.fn.vendors.draw);
	        }
	    };
	    pJS1.fn.vendors.checkBeforeDraw = function() {
	        // if shape is image
	        if (pJS1.particles.shape.type == "image") {
	            if (pJS1.tmp.img_type == "svg" && pJS1.tmp.source_svg == undefined) pJS1.tmp.checkAnimFrame = $803c8d72044680d8$var$requestAnimFrame(check);
	            else {
	                //console.log('images loaded! cancel check');
	                $803c8d72044680d8$var$cancelRequestAnimFrame(pJS1.tmp.checkAnimFrame);
	                if (!pJS1.tmp.img_error) {
	                    pJS1.fn.vendors.init();
	                    pJS1.fn.vendors.draw();
	                }
	            }
	        } else {
	            pJS1.fn.vendors.init();
	            pJS1.fn.vendors.draw();
	        }
	    };
	    pJS1.fn.vendors.init = function() {
	        /* init canvas + particles */ pJS1.fn.retinaInit();
	        pJS1.fn.canvasInit();
	        pJS1.fn.canvasSize();
	        pJS1.fn.canvasPaint();
	        pJS1.fn.particlesCreate();
	        pJS1.fn.vendors.densityAutoParticles();
	        /* particles.line_linked - convert hex colors to rgb */ pJS1.particles.line_linked.color_rgb_line = $803c8d72044680d8$var$hexToRgb(pJS1.particles.line_linked.color);
	    };
	    pJS1.fn.vendors.start = function() {
	        if ($803c8d72044680d8$var$isInArray("image", pJS1.particles.shape.type)) {
	            pJS1.tmp.img_type = pJS1.particles.shape.image.src.substr(pJS1.particles.shape.image.src.length - 3);
	            pJS1.fn.vendors.loadImg(pJS1.tmp.img_type);
	        } else pJS1.fn.vendors.checkBeforeDraw();
	    };
	    /* ---------- pJS - start ------------ */ pJS1.fn.vendors.eventsListeners();
	    pJS1.fn.vendors.start();
	}
	/* ---------- global functions - vendors ------------ */ // https://gist.github.com/fshost/4146993
	// extend one object with another object's property's (default is deep extend)
	// this works with circular references and is faster than other deep extend methods
	// http://jsperf.com/comparing-custom-deep-extend-to-jquery-deep-extend/2
	function $803c8d72044680d8$var$extend(target, source, shallow) {
	    var array = "[object Array]", object = "[object Object]", targetMeta, sourceMeta, setMeta = function(value) {
	        var jclass = ({}).toString.call(value);
	        if (value === undefined) return 0;
	        if (typeof value !== "object") return false;
	        if (jclass === array) return 1;
	        if (jclass === object) return 2;
	    };
	    for(var key in source){
	        if (source.hasOwnProperty(key)) {
	            targetMeta = setMeta(target[key]);
	            sourceMeta = setMeta(source[key]);
	            if (source[key] !== target[key]) {
	                if (!shallow && sourceMeta && targetMeta && targetMeta === sourceMeta) target[key] = $803c8d72044680d8$var$extend(target[key], source[key], true);
	                else if (sourceMeta !== 0) target[key] = source[key];
	            }
	        } else break; // ownProperties are always first (see jQuery's isPlainObject function)
	    }
	    return target;
	}
	Object.deepExtend = $803c8d72044680d8$var$extend;
	let $803c8d72044680d8$var$requestAnimFrame = function() {
	    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
	        window.setTimeout(callback, 1000 / 60);
	    };
	}();
	let $803c8d72044680d8$var$cancelRequestAnimFrame = function() {
	    return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout;
	}();
	function $803c8d72044680d8$var$hexToRgb(hex) {
	    // By Tim Down - http://stackoverflow.com/a/5624139/3493650
	    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });
	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	}
	function $803c8d72044680d8$var$clamp(number, min, max) {
	    return Math.min(Math.max(number, min), max);
	}
	function $803c8d72044680d8$var$isInArray(value, array) {
	    return array.indexOf(value) > -1;
	}
	let $803c8d72044680d8$export$133e7c9a2a8d0ed8 = [];
	function $803c8d72044680d8$export$a84195d18e286453(hex) {
	    if ($803c8d72044680d8$export$133e7c9a2a8d0ed8.length > 0) {
	        let rgbColor = $803c8d72044680d8$var$hexToRgb(hex);
	        $803c8d72044680d8$export$133e7c9a2a8d0ed8[0].pJS.particles.line_linked.color_rgb_line = rgbColor;
	        $803c8d72044680d8$export$a44bdd20d2c1d681((p)=>{
	            p.color.value = hex;
	            p.color.rgb = rgbColor;
	        });
	    }
	}
	function $803c8d72044680d8$export$a44bdd20d2c1d681(modifier) {
	    if ($803c8d72044680d8$export$133e7c9a2a8d0ed8.length > 0) $803c8d72044680d8$export$133e7c9a2a8d0ed8[0].pJS.particles.array.forEach(modifier);
	}
	function $803c8d72044680d8$export$bf4d4b4e7a8db89a(tag_id, params) {
	    /* no string id? so it's object params, and set the id with default id */ if (typeof tag_id != "string") {
	        params = tag_id;
	        tag_id = "particles-js";
	    }
	    /* no id? set the id to default id */ if (!tag_id) tag_id = "particles-js";
	    /* pJS elements */ var pJS_tag = document.getElementById(tag_id), pJS_canvas_class = "particles-js-canvas-el", exist_canvas = pJS_tag.getElementsByClassName(pJS_canvas_class);
	    /* remove canvas if exists into the pJS target tag */ if (exist_canvas.length) while(exist_canvas.length > 0)pJS_tag.removeChild(exist_canvas[0]);
	    /* create canvas element */ var canvas_el = document.createElement("canvas");
	    canvas_el.className = pJS_canvas_class;
	    /* set size canvas */ canvas_el.style.width = "100%";
	    canvas_el.style.height = "100%";
	    /* append canvas */ var canvas = document.getElementById(tag_id).appendChild(canvas_el);
	    /* launch particle.js */ if (canvas != null) $803c8d72044680d8$export$133e7c9a2a8d0ed8.push(new $803c8d72044680d8$export$47684f97fe2830db(tag_id, params));
	}

	/* src/components/Particles.svelte generated by Svelte v4.2.20 */
	const file$q = "src/components/Particles.svelte";

	function create_fragment$r(ctx) {
		let div;
		let div_class_value;

		const block = {
			c: function create() {
				div = element("div");
				attr_dev(div, "id", "particles");
				attr_dev(div, "class", div_class_value = "w-full h-full select-none p-2 " + (/*cssClass*/ ctx[0] || ''));
				add_location(div, file$q, 18, 0, 443);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*cssClass*/ 1 && div_class_value !== (div_class_value = "w-full h-full select-none p-2 " + (/*cssClass*/ ctx[0] || ''))) {
					attr_dev(div, "class", div_class_value);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$r.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$r($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Particles', slots, []);
		let { class: cssClass } = $$props;

		setTimeout(() => {
			let config = { ...particleConfig };
			new $803c8d72044680d8$export$bf4d4b4e7a8db89a('particles', config);
			darkMode.subscribe(enabled => $803c8d72044680d8$export$a84195d18e286453(enabled ? '#01b3b5' : '#000'));
		});

		$$self.$$.on_mount.push(function () {
			if (cssClass === undefined && !('class' in $$props || $$self.$$.bound[$$self.$$.props['class']])) {
				console.warn("<Particles> was created without expected prop 'class'");
			}
		});

		const writable_props = ['class'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Particles> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('class' in $$props) $$invalidate(0, cssClass = $$props.class);
		};

		$$self.$capture_state = () => ({
			darkMode,
			particleConfig,
			particlesJS: $803c8d72044680d8$export$bf4d4b4e7a8db89a,
			setParticleColor: $803c8d72044680d8$export$a84195d18e286453,
			cssClass
		});

		$$self.$inject_state = $$props => {
			if ('cssClass' in $$props) $$invalidate(0, cssClass = $$props.cssClass);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [cssClass];
	}

	class Particles extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$r, create_fragment$r, safe_not_equal, { class: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Particles",
				options,
				id: create_fragment$r.name
			});
		}

		get class() {
			throw new Error("<Particles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Particles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Menu.svelte generated by Svelte v4.2.20 */

	const file$p = "src/components/Menu.svelte";

	function get_each_context$5(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[10] = list[i];
		return child_ctx;
	}

	// (59:20) {:else}
	function create_else_block$6(ctx) {
		let path;

		const block = {
			c: function create() {
				path = svg_element("path");
				attr_dev(path, "fill-rule", "evenodd");
				attr_dev(path, "d", "M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z");
				add_location(path, file$p, 59, 20, 2116);
			},
			m: function mount(target, anchor) {
				insert_dev(target, path, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(path);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$6.name,
			type: "else",
			source: "(59:20) {:else}",
			ctx
		});

		return block;
	}

	// (56:18) {#if expanded}
	function create_if_block_1$4(ctx) {
		let path;

		const block = {
			c: function create() {
				path = svg_element("path");
				attr_dev(path, "fill-rule", "evenodd");
				attr_dev(path, "d", "M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z");
				add_location(path, file$p, 56, 18, 1833);
			},
			m: function mount(target, anchor) {
				insert_dev(target, path, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(path);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$4.name,
			type: "if",
			source: "(56:18) {#if expanded}",
			ctx
		});

		return block;
	}

	// (68:4) {#if expanded}
	function create_if_block$8(ctx) {
		let hr;

		const block = {
			c: function create() {
				hr = element("hr");
				attr_dev(hr, "class", "w-full dark:border-zinc-50/25 border-zinc-800/25 mt-1 sm:hidden");
				add_location(hr, file$p, 68, 4, 2388);
			},
			m: function mount(target, anchor) {
				insert_dev(target, hr, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(hr);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$8.name,
			type: "if",
			source: "(68:4) {#if expanded}",
			ctx
		});

		return block;
	}

	// (76:12) {#each menuItems as item}
	function create_each_block$5(ctx) {
		let a;
		let t0_value = /*item*/ ctx[10].text + "";
		let t0;
		let t1;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				a = element("a");
				t0 = text(t0_value);
				t1 = space();
				attr_dev(a, "href", /*item*/ ctx[10].link);
				attr_dev(a, "class", "block mtop-6 mt-4 lg:inline-block lg:mt-0 text-teal-900 dark:text-white dark:hover:text-sky-600 mr-4 hover:text-teal-600 svelte-ulfglg");
				add_location(a, file$p, 76, 16, 2778);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a, anchor);
				append_dev(a, t0);
				append_dev(a, t1);

				if (!mounted) {
					dispose = listen_dev(a, "click", /*menuItemClicked*/ ctx[4], false, false, false, false);
					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(a);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$5.name,
			type: "each",
			source: "(76:12) {#each menuItems as item}",
			ctx
		});

		return block;
	}

	function create_fragment$q(ctx) {
		let nav;
		let div1;
		let a;
		let t1;
		let div0;
		let button;
		let svg0;
		let t2;
		let t3;
		let div7;
		let div2;
		let t4;
		let div6;
		let div3;
		let svg1;
		let path0;
		let svg1_class_value;
		let t5;
		let div5;
		let div4;
		let svg2;
		let path1;
		let path2;
		let svg2_class_value;
		let div4_title_value;
		let div7_class_value;
		let mounted;
		let dispose;

		function select_block_type(ctx, dirty) {
			if (/*expanded*/ ctx[1]) return create_if_block_1$4;
			return create_else_block$6;
		}

		let current_block_type = select_block_type(ctx);
		let if_block0 = current_block_type(ctx);
		let if_block1 = /*expanded*/ ctx[1] && create_if_block$8(ctx);
		let each_value = ensure_array_like_dev(/*menuItems*/ ctx[3]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				nav = element("nav");
				div1 = element("div");
				a = element("a");
				a.textContent = "Meerman";
				t1 = space();
				div0 = element("div");
				button = element("button");
				svg0 = svg_element("svg");
				if_block0.c();
				t2 = space();
				if (if_block1) if_block1.c();
				t3 = space();
				div7 = element("div");
				div2 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t4 = space();
				div6 = element("div");
				div3 = element("div");
				svg1 = svg_element("svg");
				path0 = svg_element("path");
				t5 = space();
				div5 = element("div");
				div4 = element("div");
				svg2 = svg_element("svg");
				path1 = svg_element("path");
				path2 = svg_element("path");
				attr_dev(a, "href", "/#/");
				attr_dev(a, "class", "font-semibold text-xl tracking-tight");
				add_location(a, file$p, 49, 8, 1435);
				attr_dev(svg0, "class", "h-6 w-6 fill-current");
				attr_dev(svg0, "viewBox", "0 0 24 24");
				add_location(svg0, file$p, 53, 16, 1726);
				attr_dev(button, "type", "button");
				attr_dev(button, "class", "text-gray-500 hover:text-white focus:text-white focus:outline-none transition");
				add_location(button, file$p, 52, 12, 1561);
				attr_dev(div0, "class", "sm:hidden mr-4 flex");
				add_location(div0, file$p, 51, 8, 1515);
				attr_dev(div1, "class", "flex items-center flex-shrink-0 dark:text-white mr-6 justify-between w-full sm:w-20");
				add_location(div1, file$p, 48, 4, 1329);
				attr_dev(div2, "class", "text-sm sm:flex sm:flex-grow");
				add_location(div2, file$p, 74, 8, 2681);
				attr_dev(path0, "d", "M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z");
				add_location(path0, file$p, 106, 16, 3776);
				attr_dev(svg1, "class", svg1_class_value = "" + (null_to_empty(getIconClass(/*$darkMode*/ ctx[2])) + " svelte-ulfglg"));
				attr_dev(svg1, "width", "24px");
				attr_dev(svg1, "height", "24px");
				attr_dev(svg1, "viewBox", "0 0 16 16");
				add_location(svg1, file$p, 100, 12, 3598);
				attr_dev(div3, "class", "hover:animate-pulse");
				attr_dev(div3, "title", /*particleText*/ ctx[0]);
				attr_dev(div3, "role", "button");
				attr_dev(div3, "tabindex", "0");
				add_location(div3, file$p, 87, 12, 3197);
				attr_dev(path1, "d", "M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z");
				add_location(path1, file$p, 132, 20, 5516);
				attr_dev(path2, "fill-rule", "evenodd");
				attr_dev(path2, "clip-rule", "evenodd");
				attr_dev(path2, "d", "M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16V20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z");
				add_location(path2, file$p, 135, 20, 5658);
				attr_dev(svg2, "class", svg2_class_value = "" + (null_to_empty(getIconClass(/*$darkMode*/ ctx[2])) + " svelte-ulfglg"));
				attr_dev(svg2, "width", "24px");
				attr_dev(svg2, "height", "24px");
				attr_dev(svg2, "viewBox", "0 0 24 24");
				attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
				add_location(svg2, file$p, 125, 16, 5259);
				attr_dev(div4, "tabindex", "0");
				attr_dev(div4, "class", "cursor-pointer mtop-0 sm:mtop-6");
				attr_dev(div4, "role", "button");
				attr_dev(div4, "title", div4_title_value = /*$darkMode*/ ctx[2] ? "Lightmode" : "Darkmode");
				add_location(div4, file$p, 112, 12, 4780);
				add_location(div5, file$p, 111, 8, 4762);
				attr_dev(div6, "class", "flex flex-row mt-2 sm:mt-0 gap-4 sm:gap-2");
				add_location(div6, file$p, 86, 8, 3129);
				attr_dev(div7, "class", div7_class_value = "w-full block flex-grow sm:flex sm:items-center sm:w-auto sm:h-7 transition-all duration-500 sm:overflow-visible overflow-hidden " + (/*expanded*/ ctx[1] ? 'max-h-48' : 'max-h-0'));
				add_location(div7, file$p, 71, 4, 2482);
				attr_dev(nav, "class", "border-b-2 border-teal-500 dark:border-sky-600 dark:bg-zinc-700 flex items-center justify-between flex-wrap p-2 pt-1 duration-500");
				add_location(nav, file$p, 44, 0, 1175);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, nav, anchor);
				append_dev(nav, div1);
				append_dev(div1, a);
				append_dev(div1, t1);
				append_dev(div1, div0);
				append_dev(div0, button);
				append_dev(button, svg0);
				if_block0.m(svg0, null);
				append_dev(nav, t2);
				if (if_block1) if_block1.m(nav, null);
				append_dev(nav, t3);
				append_dev(nav, div7);
				append_dev(div7, div2);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div2, null);
					}
				}

				append_dev(div7, t4);
				append_dev(div7, div6);
				append_dev(div6, div3);
				append_dev(div3, svg1);
				append_dev(svg1, path0);
				append_dev(div6, t5);
				append_dev(div6, div5);
				append_dev(div5, div4);
				append_dev(div4, svg2);
				append_dev(svg2, path1);
				append_dev(svg2, path2);

				if (!mounted) {
					dispose = [
						listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false, false),
						listen_dev(div3, "click", /*click_handler_1*/ ctx[6], false, false, false, false),
						listen_dev(div3, "keydown", /*keydown_handler*/ ctx[7], false, false, false, false),
						listen_dev(div4, "click", toggleDarkMode, false, false, false, false),
						listen_dev(div4, "keydown", /*keydown_handler_1*/ ctx[8], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (current_block_type !== (current_block_type = select_block_type(ctx))) {
					if_block0.d(1);
					if_block0 = current_block_type(ctx);

					if (if_block0) {
						if_block0.c();
						if_block0.m(svg0, null);
					}
				}

				if (/*expanded*/ ctx[1]) {
					if (if_block1) ; else {
						if_block1 = create_if_block$8(ctx);
						if_block1.c();
						if_block1.m(nav, t3);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (dirty & /*menuItems, menuItemClicked*/ 24) {
					each_value = ensure_array_like_dev(/*menuItems*/ ctx[3]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$5(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$5(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div2, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (dirty & /*$darkMode*/ 4 && svg1_class_value !== (svg1_class_value = "" + (null_to_empty(getIconClass(/*$darkMode*/ ctx[2])) + " svelte-ulfglg"))) {
					attr_dev(svg1, "class", svg1_class_value);
				}

				if (dirty & /*particleText*/ 1) {
					attr_dev(div3, "title", /*particleText*/ ctx[0]);
				}

				if (dirty & /*$darkMode*/ 4 && svg2_class_value !== (svg2_class_value = "" + (null_to_empty(getIconClass(/*$darkMode*/ ctx[2])) + " svelte-ulfglg"))) {
					attr_dev(svg2, "class", svg2_class_value);
				}

				if (dirty & /*$darkMode*/ 4 && div4_title_value !== (div4_title_value = /*$darkMode*/ ctx[2] ? "Lightmode" : "Darkmode")) {
					attr_dev(div4, "title", div4_title_value);
				}

				if (dirty & /*expanded*/ 2 && div7_class_value !== (div7_class_value = "w-full block flex-grow sm:flex sm:items-center sm:w-auto sm:h-7 transition-all duration-500 sm:overflow-visible overflow-hidden " + (/*expanded*/ ctx[1] ? 'max-h-48' : 'max-h-0'))) {
					attr_dev(div7, "class", div7_class_value);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(nav);
				}

				if_block0.d();
				if (if_block1) if_block1.d();
				destroy_each(each_blocks, detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$q.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function getIconClass(isDarkMode) {
		return `icon-hover ${isDarkMode ? 'dark:fill-white' : 'fill-black'}`;
	}

	function instance$q($$self, $$props, $$invalidate) {
		let $darkMode;
		validate_store(darkMode, 'darkMode');
		component_subscribe($$self, darkMode, $$value => $$invalidate(2, $darkMode = $$value));
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Menu', slots, []);
		let darkModeIconFill;
		let particleText = "Disable particles";
		let expanded = false;

		let menuItems = [
			{ link: "#/skills", text: "Skills" },
			{ link: "#/experience", text: "Experience" },
			{ link: "#/education", text: "Education" },
			{ link: "#/tools", text: "Tools" },
			{ link: "#/blog", text: "Blog" }
		]; //        { link: "#/canvas", text: "Canvas" },

		darkMode.subscribe(enabled => {
			if (enabled) darkModeIconFill = "white"; else darkModeIconFill = "black";
		});

		particlesEnabled.subscribe(enabled => {
			if (enabled) $$invalidate(0, particleText = "Disable particles"); else $$invalidate(0, particleText = "Enable particles");
		});

		function menuItemClicked() {
			$$invalidate(1, expanded = false);

			if (window && window.tinylytics) {
				window.tinylytics.triggerUpdate();
			}
		}

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
		});

		const click_handler = () => $$invalidate(1, expanded = !expanded);
		const click_handler_1 = () => toggleParticles();

		const keydown_handler = e => {
			if (e.key === "Enter" || e.key === " ") {
				toggleParticles();
				e.preventDefault();
			}
		};

		const keydown_handler_1 = e => {
			if (e.key === "Enter" || e.key === " ") {
				toggleDarkMode();
				e.preventDefault();
			}
		};

		$$self.$capture_state = () => ({
			darkMode,
			toggleDarkMode,
			particlesEnabled,
			toggleParticles,
			darkModeIconFill,
			particleText,
			expanded,
			menuItems,
			getIconClass,
			menuItemClicked,
			$darkMode
		});

		$$self.$inject_state = $$props => {
			if ('darkModeIconFill' in $$props) darkModeIconFill = $$props.darkModeIconFill;
			if ('particleText' in $$props) $$invalidate(0, particleText = $$props.particleText);
			if ('expanded' in $$props) $$invalidate(1, expanded = $$props.expanded);
			if ('menuItems' in $$props) $$invalidate(3, menuItems = $$props.menuItems);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			particleText,
			expanded,
			$darkMode,
			menuItems,
			menuItemClicked,
			click_handler,
			click_handler_1,
			keydown_handler,
			keydown_handler_1
		];
	}

	class Menu extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Menu",
				options,
				id: create_fragment$q.name
			});
		}
	}

	const digitCharacters = [
	    "0",
	    "1",
	    "2",
	    "3",
	    "4",
	    "5",
	    "6",
	    "7",
	    "8",
	    "9",
	    "A",
	    "B",
	    "C",
	    "D",
	    "E",
	    "F",
	    "G",
	    "H",
	    "I",
	    "J",
	    "K",
	    "L",
	    "M",
	    "N",
	    "O",
	    "P",
	    "Q",
	    "R",
	    "S",
	    "T",
	    "U",
	    "V",
	    "W",
	    "X",
	    "Y",
	    "Z",
	    "a",
	    "b",
	    "c",
	    "d",
	    "e",
	    "f",
	    "g",
	    "h",
	    "i",
	    "j",
	    "k",
	    "l",
	    "m",
	    "n",
	    "o",
	    "p",
	    "q",
	    "r",
	    "s",
	    "t",
	    "u",
	    "v",
	    "w",
	    "x",
	    "y",
	    "z",
	    "#",
	    "$",
	    "%",
	    "*",
	    "+",
	    ",",
	    "-",
	    ".",
	    ":",
	    ";",
	    "=",
	    "?",
	    "@",
	    "[",
	    "]",
	    "^",
	    "_",
	    "{",
	    "|",
	    "}",
	    "~"
	];
	const decode83 = (str) => {
	    let value = 0;
	    for (let i = 0; i < str.length; i++) {
	        const c = str[i];
	        const digit = digitCharacters.indexOf(c);
	        value = value * 83 + digit;
	    }
	    return value;
	};

	const sRGBToLinear = (value) => {
	    let v = value / 255;
	    if (v <= 0.04045) {
	        return v / 12.92;
	    }
	    else {
	        return Math.pow((v + 0.055) / 1.055, 2.4);
	    }
	};
	const linearTosRGB = (value) => {
	    let v = Math.max(0, Math.min(1, value));
	    if (v <= 0.0031308) {
	        return Math.round(v * 12.92 * 255 + 0.5);
	    }
	    else {
	        return Math.round((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5);
	    }
	};
	const sign = (n) => (n < 0 ? -1 : 1);
	const signPow = (val, exp) => sign(val) * Math.pow(Math.abs(val), exp);

	class ValidationError extends Error {
	    constructor(message) {
	        super(message);
	        this.name = "ValidationError";
	        this.message = message;
	    }
	}

	/**
	 * Returns an error message if invalid or undefined if valid
	 * @param blurhash
	 */
	const validateBlurhash = (blurhash) => {
	    if (!blurhash || blurhash.length < 6) {
	        throw new ValidationError("The blurhash string must be at least 6 characters");
	    }
	    const sizeFlag = decode83(blurhash[0]);
	    const numY = Math.floor(sizeFlag / 9) + 1;
	    const numX = (sizeFlag % 9) + 1;
	    if (blurhash.length !== 4 + 2 * numX * numY) {
	        throw new ValidationError(`blurhash length mismatch: length is ${blurhash.length} but it should be ${4 + 2 * numX * numY}`);
	    }
	};
	const decodeDC = (value) => {
	    const intR = value >> 16;
	    const intG = (value >> 8) & 255;
	    const intB = value & 255;
	    return [sRGBToLinear(intR), sRGBToLinear(intG), sRGBToLinear(intB)];
	};
	const decodeAC = (value, maximumValue) => {
	    const quantR = Math.floor(value / (19 * 19));
	    const quantG = Math.floor(value / 19) % 19;
	    const quantB = value % 19;
	    const rgb = [
	        signPow((quantR - 9) / 9, 2.0) * maximumValue,
	        signPow((quantG - 9) / 9, 2.0) * maximumValue,
	        signPow((quantB - 9) / 9, 2.0) * maximumValue
	    ];
	    return rgb;
	};
	const decode = (blurhash, width, height, punch) => {
	    validateBlurhash(blurhash);
	    punch = punch | 1;
	    const sizeFlag = decode83(blurhash[0]);
	    const numY = Math.floor(sizeFlag / 9) + 1;
	    const numX = (sizeFlag % 9) + 1;
	    const quantisedMaximumValue = decode83(blurhash[1]);
	    const maximumValue = (quantisedMaximumValue + 1) / 166;
	    const colors = new Array(numX * numY);
	    for (let i = 0; i < colors.length; i++) {
	        if (i === 0) {
	            const value = decode83(blurhash.substring(2, 6));
	            colors[i] = decodeDC(value);
	        }
	        else {
	            const value = decode83(blurhash.substring(4 + i * 2, 6 + i * 2));
	            colors[i] = decodeAC(value, maximumValue * punch);
	        }
	    }
	    const bytesPerRow = width * 4;
	    const pixels = new Uint8ClampedArray(bytesPerRow * height);
	    for (let y = 0; y < height; y++) {
	        for (let x = 0; x < width; x++) {
	            let r = 0;
	            let g = 0;
	            let b = 0;
	            for (let j = 0; j < numY; j++) {
	                for (let i = 0; i < numX; i++) {
	                    const basis = Math.cos((Math.PI * x * i) / width) *
	                        Math.cos((Math.PI * y * j) / height);
	                    let color = colors[i + j * numX];
	                    r += color[0] * basis;
	                    g += color[1] * basis;
	                    b += color[2] * basis;
	                }
	            }
	            let intR = linearTosRGB(r);
	            let intG = linearTosRGB(g);
	            let intB = linearTosRGB(b);
	            pixels[4 * x + 0 + y * bytesPerRow] = intR;
	            pixels[4 * x + 1 + y * bytesPerRow] = intG;
	            pixels[4 * x + 2 + y * bytesPerRow] = intB;
	            pixels[4 * x + 3 + y * bytesPerRow] = 255; // alpha
	        }
	    }
	    return pixels;
	};
	var decode$1 = decode;

	/* node_modules/svelte-waypoint/src/Waypoint.svelte generated by Svelte v4.2.20 */
	const file$o = "node_modules/svelte-waypoint/src/Waypoint.svelte";

	// (139:2) {#if visible}
	function create_if_block$7(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[11].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[10],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$7.name,
			type: "if",
			source: "(139:2) {#if visible}",
			ctx
		});

		return block;
	}

	function create_fragment$p(ctx) {
		let div;
		let div_class_value;
		let current;
		let mounted;
		let dispose;
		let if_block = /*visible*/ ctx[3] && create_if_block$7(ctx);

		const block = {
			c: function create() {
				div = element("div");
				if (if_block) if_block.c();
				attr_dev(div, "class", div_class_value = "wrapper " + /*className*/ ctx[2] + " " + /*c*/ ctx[0] + " svelte-142y8oi");
				attr_dev(div, "style", /*style*/ ctx[1]);
				add_location(div, file$o, 137, 0, 3091);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				if (if_block) if_block.m(div, null);
				current = true;

				if (!mounted) {
					dispose = action_destroyer(/*waypoint*/ ctx[4].call(null, div));
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (/*visible*/ ctx[3]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*visible*/ 8) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$7(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(div, null);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}

				if (!current || dirty & /*className, c*/ 5 && div_class_value !== (div_class_value = "wrapper " + /*className*/ ctx[2] + " " + /*c*/ ctx[0] + " svelte-142y8oi")) {
					attr_dev(div, "class", div_class_value);
				}

				if (!current || dirty & /*style*/ 2) {
					attr_dev(div, "style", /*style*/ ctx[1]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (if_block) if_block.d();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$p.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function throttleFn(fn, time) {
		let last, deferTimer;

		return () => {
			const now = +new Date();

			if (last && now < last + time) {
				// hold on to it
				clearTimeout(deferTimer);

				deferTimer = setTimeout(
					function () {
						last = now;
						fn();
					},
					time
				);
			} else {
				last = now;
				fn();
			}
		};
	}

	function instance$p($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Waypoint', slots, ['default']);
		const dispatch = createEventDispatcher();
		let { offset = 0 } = $$props;
		let { throttle = 250 } = $$props;
		let { c = '' } = $$props;
		let { style = '' } = $$props;
		let { once = true } = $$props;
		let { threshold = 1.0 } = $$props;
		let { disabled = false } = $$props;
		let { class: className = "" } = $$props;
		let visible = disabled;
		let wasVisible = false;
		let intersecting = false;

		let removeHandlers = () => {
			
		};

		function callEvents(wasVisible, observer, node) {
			if (visible && !wasVisible) {
				dispatch('enter');
				return;
			}

			if (wasVisible && !intersecting) {
				dispatch('leave');
			}

			if (once && wasVisible && !intersecting) {
				removeHandlers();
			}
		}

		function waypoint(node) {
			if (!window || disabled) return;

			if (window.IntersectionObserver && window.IntersectionObserverEntry) {
				const observer = new IntersectionObserver(([{ isIntersecting }]) => {
						wasVisible = visible;
						intersecting = isIntersecting;

						if (wasVisible && once && !isIntersecting) {
							callEvents(wasVisible);
							return;
						}

						$$invalidate(3, visible = isIntersecting);
						callEvents(wasVisible);
					},
				{ rootMargin: offset + 'px', threshold });

				observer.observe(node);
				removeHandlers = () => observer.unobserve(node);
				return removeHandlers;
			}

			function checkIsVisible() {
				// Kudos https://github.com/twobin/react-lazyload/blob/master/src/index.jsx#L93
				if (!(node.offsetWidth || node.offsetHeight || node.getClientRects().length)) return;

				let top;
				let height;

				try {
					({ top, height } = node.getBoundingClientRect());
				} catch(e) {
					({ top, height } = defaultBoundingClientRect);
				}

				const windowInnerHeight = window.innerHeight || document.documentElement.clientHeight;
				wasVisible = visible;
				intersecting = top - offset <= windowInnerHeight && top + height + offset >= 0;

				if (wasVisible && once && !isIntersecting) {
					callEvents(wasVisible, observer);
					return;
				}

				$$invalidate(3, visible = intersecting);
				callEvents(wasVisible);
			}

			checkIsVisible();
			const throttled = throttleFn(checkIsVisible, throttle);
			window.addEventListener('scroll', throttled);
			window.addEventListener('resize', throttled);

			removeHandlers = () => {
				window.removeEventListener('scroll', throttled);
				window.removeEventListener('resize', throttled);
			};

			return removeHandlers;
		}

		const writable_props = ['offset', 'throttle', 'c', 'style', 'once', 'threshold', 'disabled', 'class'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Waypoint> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('offset' in $$props) $$invalidate(5, offset = $$props.offset);
			if ('throttle' in $$props) $$invalidate(6, throttle = $$props.throttle);
			if ('c' in $$props) $$invalidate(0, c = $$props.c);
			if ('style' in $$props) $$invalidate(1, style = $$props.style);
			if ('once' in $$props) $$invalidate(7, once = $$props.once);
			if ('threshold' in $$props) $$invalidate(8, threshold = $$props.threshold);
			if ('disabled' in $$props) $$invalidate(9, disabled = $$props.disabled);
			if ('class' in $$props) $$invalidate(2, className = $$props.class);
			if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			onDestroy,
			dispatch,
			offset,
			throttle,
			c,
			style,
			once,
			threshold,
			disabled,
			className,
			visible,
			wasVisible,
			intersecting,
			removeHandlers,
			throttleFn,
			callEvents,
			waypoint
		});

		$$self.$inject_state = $$props => {
			if ('offset' in $$props) $$invalidate(5, offset = $$props.offset);
			if ('throttle' in $$props) $$invalidate(6, throttle = $$props.throttle);
			if ('c' in $$props) $$invalidate(0, c = $$props.c);
			if ('style' in $$props) $$invalidate(1, style = $$props.style);
			if ('once' in $$props) $$invalidate(7, once = $$props.once);
			if ('threshold' in $$props) $$invalidate(8, threshold = $$props.threshold);
			if ('disabled' in $$props) $$invalidate(9, disabled = $$props.disabled);
			if ('className' in $$props) $$invalidate(2, className = $$props.className);
			if ('visible' in $$props) $$invalidate(3, visible = $$props.visible);
			if ('wasVisible' in $$props) wasVisible = $$props.wasVisible;
			if ('intersecting' in $$props) intersecting = $$props.intersecting;
			if ('removeHandlers' in $$props) removeHandlers = $$props.removeHandlers;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			c,
			style,
			className,
			visible,
			waypoint,
			offset,
			throttle,
			once,
			threshold,
			disabled,
			$$scope,
			slots
		];
	}

	class Waypoint extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$p, create_fragment$p, safe_not_equal, {
				offset: 5,
				throttle: 6,
				c: 0,
				style: 1,
				once: 7,
				threshold: 8,
				disabled: 9,
				class: 2
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Waypoint",
				options,
				id: create_fragment$p.name
			});
		}

		get offset() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set offset(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get throttle() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set throttle(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get c() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set c(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get style() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get once() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set once(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get threshold() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set threshold(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get disabled() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set disabled(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get class() {
			throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/svelte-image/src/Image.svelte generated by Svelte v4.2.20 */
	const file$n = "node_modules/svelte-image/src/Image.svelte";

	// (92:6) {:else}
	function create_else_block$5(ctx) {
		let img;
		let img_class_value;
		let img_src_value;

		const block = {
			c: function create() {
				img = element("img");
				attr_dev(img, "class", img_class_value = "placeholder " + /*placeholderClass*/ ctx[14] + " svelte-ilz1a1");
				if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[4])) attr_dev(img, "src", img_src_value);
				attr_dev(img, "alt", /*alt*/ ctx[1]);
				toggle_class(img, "blur", /*blur*/ ctx[8]);
				add_location(img, file$n, 92, 8, 2107);
			},
			m: function mount(target, anchor) {
				insert_dev(target, img, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*placeholderClass*/ 16384 && img_class_value !== (img_class_value = "placeholder " + /*placeholderClass*/ ctx[14] + " svelte-ilz1a1")) {
					attr_dev(img, "class", img_class_value);
				}

				if (dirty & /*src*/ 16 && !src_url_equal(img.src, img_src_value = /*src*/ ctx[4])) {
					attr_dev(img, "src", img_src_value);
				}

				if (dirty & /*alt*/ 2) {
					attr_dev(img, "alt", /*alt*/ ctx[1]);
				}

				if (dirty & /*placeholderClass, blur*/ 16640) {
					toggle_class(img, "blur", /*blur*/ ctx[8]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(img);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$5.name,
			type: "else",
			source: "(92:6) {:else}",
			ctx
		});

		return block;
	}

	// (90:6) {#if blurhash}
	function create_if_block$6(ctx) {
		let canvas;
		let canvas_width_value;
		let canvas_height_value;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				canvas = element("canvas");
				attr_dev(canvas, "class", "placeholder svelte-ilz1a1");
				attr_dev(canvas, "width", canvas_width_value = /*blurhashSize*/ ctx[16].width);
				attr_dev(canvas, "height", canvas_height_value = /*blurhashSize*/ ctx[16].height);
				add_location(canvas, file$n, 90, 8, 1979);
			},
			m: function mount(target, anchor) {
				insert_dev(target, canvas, anchor);

				if (!mounted) {
					dispose = action_destroyer(/*decodeBlurhash*/ ctx[20].call(null, canvas));
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*blurhashSize*/ 65536 && canvas_width_value !== (canvas_width_value = /*blurhashSize*/ ctx[16].width)) {
					attr_dev(canvas, "width", canvas_width_value);
				}

				if (dirty & /*blurhashSize*/ 65536 && canvas_height_value !== (canvas_height_value = /*blurhashSize*/ ctx[16].height)) {
					attr_dev(canvas, "height", canvas_height_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(canvas);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$6.name,
			type: "if",
			source: "(90:6) {#if blurhash}",
			ctx
		});

		return block;
	}

	// (79:0) <Waypoint   class="{wrapperClass}"   style="min-height: 100px; width: 100%;"   once   {threshold}   {offset}   disabled="{!lazy}" >
	function create_default_slot$a(ctx) {
		let div2;
		let div1;
		let div0;
		let t0;
		let t1;
		let picture;
		let source0;
		let source0_srcset_value;
		let t2;
		let source1;
		let source1_srcset_value;
		let t3;
		let img;
		let img_src_value;
		let img_class_value;
		let mounted;
		let dispose;

		function select_block_type(ctx, dirty) {
			if (/*blurhash*/ ctx[15]) return create_if_block$6;
			return create_else_block$5;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				div2 = element("div");
				div1 = element("div");
				div0 = element("div");
				t0 = space();
				if_block.c();
				t1 = space();
				picture = element("picture");
				source0 = element("source");
				t2 = space();
				source1 = element("source");
				t3 = space();
				img = element("img");
				set_style(div0, "width", "100%");
				set_style(div0, "padding-bottom", /*ratio*/ ctx[7]);
				add_location(div0, file$n, 88, 6, 1895);
				attr_dev(source0, "type", "image/webp");
				if (!srcset_url_equal(source0, source0_srcset_value = /*srcsetWebp*/ ctx[6])) attr_dev(source0, "srcset", source0_srcset_value);
				attr_dev(source0, "sizes", /*sizes*/ ctx[9]);
				add_location(source0, file$n, 95, 8, 2213);
				if (!srcset_url_equal(source1, source1_srcset_value = /*srcset*/ ctx[5])) attr_dev(source1, "srcset", source1_srcset_value);
				attr_dev(source1, "sizes", /*sizes*/ ctx[9]);
				add_location(source1, file$n, 96, 8, 2280);
				if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[4])) attr_dev(img, "src", img_src_value);
				attr_dev(img, "class", img_class_value = "main " + /*c*/ ctx[0] + " " + /*className*/ ctx[17] + " svelte-ilz1a1");
				attr_dev(img, "alt", /*alt*/ ctx[1]);
				attr_dev(img, "width", /*width*/ ctx[2]);
				attr_dev(img, "height", /*height*/ ctx[3]);
				add_location(img, file$n, 97, 8, 2316);
				add_location(picture, file$n, 94, 6, 2195);
				set_style(div1, "position", "relative");
				set_style(div1, "overflow", "hidden");
				add_location(div1, file$n, 87, 4, 1837);
				set_style(div2, "position", "relative");
				set_style(div2, "width", "100%");
				attr_dev(div2, "class", "svelte-ilz1a1");
				toggle_class(div2, "loaded", /*loaded*/ ctx[18]);
				add_location(div2, file$n, 86, 2, 1773);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, div1);
				append_dev(div1, div0);
				append_dev(div1, t0);
				if_block.m(div1, null);
				append_dev(div1, t1);
				append_dev(div1, picture);
				append_dev(picture, source0);
				append_dev(picture, t2);
				append_dev(picture, source1);
				append_dev(picture, t3);
				append_dev(picture, img);

				if (!mounted) {
					dispose = action_destroyer(/*load*/ ctx[19].call(null, img));
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*ratio*/ 128) {
					set_style(div0, "padding-bottom", /*ratio*/ ctx[7]);
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(div1, t1);
					}
				}

				if (dirty & /*srcsetWebp*/ 64 && source0_srcset_value !== (source0_srcset_value = /*srcsetWebp*/ ctx[6])) {
					attr_dev(source0, "srcset", source0_srcset_value);
				}

				if (dirty & /*sizes*/ 512) {
					attr_dev(source0, "sizes", /*sizes*/ ctx[9]);
				}

				if (dirty & /*srcset*/ 32 && source1_srcset_value !== (source1_srcset_value = /*srcset*/ ctx[5])) {
					attr_dev(source1, "srcset", source1_srcset_value);
				}

				if (dirty & /*sizes*/ 512) {
					attr_dev(source1, "sizes", /*sizes*/ ctx[9]);
				}

				if (dirty & /*src*/ 16 && !src_url_equal(img.src, img_src_value = /*src*/ ctx[4])) {
					attr_dev(img, "src", img_src_value);
				}

				if (dirty & /*c, className*/ 131073 && img_class_value !== (img_class_value = "main " + /*c*/ ctx[0] + " " + /*className*/ ctx[17] + " svelte-ilz1a1")) {
					attr_dev(img, "class", img_class_value);
				}

				if (dirty & /*alt*/ 2) {
					attr_dev(img, "alt", /*alt*/ ctx[1]);
				}

				if (dirty & /*width*/ 4) {
					attr_dev(img, "width", /*width*/ ctx[2]);
				}

				if (dirty & /*height*/ 8) {
					attr_dev(img, "height", /*height*/ ctx[3]);
				}

				if (dirty & /*loaded*/ 262144) {
					toggle_class(div2, "loaded", /*loaded*/ ctx[18]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div2);
				}

				if_block.d();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$a.name,
			type: "slot",
			source: "(79:0) <Waypoint   class=\\\"{wrapperClass}\\\"   style=\\\"min-height: 100px; width: 100%;\\\"   once   {threshold}   {offset}   disabled=\\\"{!lazy}\\\" >",
			ctx
		});

		return block;
	}

	function create_fragment$o(ctx) {
		let waypoint;
		let current;

		waypoint = new Waypoint({
				props: {
					class: /*wrapperClass*/ ctx[13],
					style: "min-height: 100px; width: 100%;",
					once: true,
					threshold: /*threshold*/ ctx[11],
					offset: /*offset*/ ctx[10],
					disabled: !/*lazy*/ ctx[12],
					$$slots: { default: [create_default_slot$a] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(waypoint.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(waypoint, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const waypoint_changes = {};
				if (dirty & /*wrapperClass*/ 8192) waypoint_changes.class = /*wrapperClass*/ ctx[13];
				if (dirty & /*threshold*/ 2048) waypoint_changes.threshold = /*threshold*/ ctx[11];
				if (dirty & /*offset*/ 1024) waypoint_changes.offset = /*offset*/ ctx[10];
				if (dirty & /*lazy*/ 4096) waypoint_changes.disabled = !/*lazy*/ ctx[12];

				if (dirty & /*$$scope, loaded, src, c, className, alt, width, height, srcset, sizes, srcsetWebp, blurhashSize, blurhash, placeholderClass, blur, ratio*/ 2606079) {
					waypoint_changes.$$scope = { dirty, ctx };
				}

				waypoint.$set(waypoint_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(waypoint.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(waypoint.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(waypoint, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$o.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$o($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Image', slots, []);
		let { c = "" } = $$props;
		let { alt = "" } = $$props;
		let { width = null } = $$props;
		let { height = null } = $$props;
		let { src = "" } = $$props;
		let { srcset = "" } = $$props;
		let { srcsetWebp = "" } = $$props;
		let { ratio = "100%" } = $$props;
		let { blur = true } = $$props;
		let { sizes = "(max-width: 1000px) 100vw, 1000px" } = $$props;
		let { offset = 0 } = $$props;
		let { threshold = 1.0 } = $$props;
		let { lazy = true } = $$props;
		let { wrapperClass = "" } = $$props;
		let { placeholderClass = "" } = $$props;
		let { blurhash = null } = $$props;
		let { blurhashSize = null } = $$props;
		let { class: className = "" } = $$props;
		let loaded = !lazy;

		function load(img) {
			img.onload = () => $$invalidate(18, loaded = true);
		}

		function decodeBlurhash(canvas) {
			const pixels = decode$1(blurhash, blurhashSize.width, blurhashSize.height);
			const ctx = canvas.getContext('2d');
			const imageData = ctx.createImageData(blurhashSize.width, blurhashSize.height);
			imageData.data.set(pixels);
			ctx.putImageData(imageData, 0, 0);
		}

		const writable_props = [
			'c',
			'alt',
			'width',
			'height',
			'src',
			'srcset',
			'srcsetWebp',
			'ratio',
			'blur',
			'sizes',
			'offset',
			'threshold',
			'lazy',
			'wrapperClass',
			'placeholderClass',
			'blurhash',
			'blurhashSize',
			'class'
		];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Image> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('c' in $$props) $$invalidate(0, c = $$props.c);
			if ('alt' in $$props) $$invalidate(1, alt = $$props.alt);
			if ('width' in $$props) $$invalidate(2, width = $$props.width);
			if ('height' in $$props) $$invalidate(3, height = $$props.height);
			if ('src' in $$props) $$invalidate(4, src = $$props.src);
			if ('srcset' in $$props) $$invalidate(5, srcset = $$props.srcset);
			if ('srcsetWebp' in $$props) $$invalidate(6, srcsetWebp = $$props.srcsetWebp);
			if ('ratio' in $$props) $$invalidate(7, ratio = $$props.ratio);
			if ('blur' in $$props) $$invalidate(8, blur = $$props.blur);
			if ('sizes' in $$props) $$invalidate(9, sizes = $$props.sizes);
			if ('offset' in $$props) $$invalidate(10, offset = $$props.offset);
			if ('threshold' in $$props) $$invalidate(11, threshold = $$props.threshold);
			if ('lazy' in $$props) $$invalidate(12, lazy = $$props.lazy);
			if ('wrapperClass' in $$props) $$invalidate(13, wrapperClass = $$props.wrapperClass);
			if ('placeholderClass' in $$props) $$invalidate(14, placeholderClass = $$props.placeholderClass);
			if ('blurhash' in $$props) $$invalidate(15, blurhash = $$props.blurhash);
			if ('blurhashSize' in $$props) $$invalidate(16, blurhashSize = $$props.blurhashSize);
			if ('class' in $$props) $$invalidate(17, className = $$props.class);
		};

		$$self.$capture_state = () => ({
			decode: decode$1,
			Waypoint,
			c,
			alt,
			width,
			height,
			src,
			srcset,
			srcsetWebp,
			ratio,
			blur,
			sizes,
			offset,
			threshold,
			lazy,
			wrapperClass,
			placeholderClass,
			blurhash,
			blurhashSize,
			className,
			loaded,
			load,
			decodeBlurhash
		});

		$$self.$inject_state = $$props => {
			if ('c' in $$props) $$invalidate(0, c = $$props.c);
			if ('alt' in $$props) $$invalidate(1, alt = $$props.alt);
			if ('width' in $$props) $$invalidate(2, width = $$props.width);
			if ('height' in $$props) $$invalidate(3, height = $$props.height);
			if ('src' in $$props) $$invalidate(4, src = $$props.src);
			if ('srcset' in $$props) $$invalidate(5, srcset = $$props.srcset);
			if ('srcsetWebp' in $$props) $$invalidate(6, srcsetWebp = $$props.srcsetWebp);
			if ('ratio' in $$props) $$invalidate(7, ratio = $$props.ratio);
			if ('blur' in $$props) $$invalidate(8, blur = $$props.blur);
			if ('sizes' in $$props) $$invalidate(9, sizes = $$props.sizes);
			if ('offset' in $$props) $$invalidate(10, offset = $$props.offset);
			if ('threshold' in $$props) $$invalidate(11, threshold = $$props.threshold);
			if ('lazy' in $$props) $$invalidate(12, lazy = $$props.lazy);
			if ('wrapperClass' in $$props) $$invalidate(13, wrapperClass = $$props.wrapperClass);
			if ('placeholderClass' in $$props) $$invalidate(14, placeholderClass = $$props.placeholderClass);
			if ('blurhash' in $$props) $$invalidate(15, blurhash = $$props.blurhash);
			if ('blurhashSize' in $$props) $$invalidate(16, blurhashSize = $$props.blurhashSize);
			if ('className' in $$props) $$invalidate(17, className = $$props.className);
			if ('loaded' in $$props) $$invalidate(18, loaded = $$props.loaded);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			c,
			alt,
			width,
			height,
			src,
			srcset,
			srcsetWebp,
			ratio,
			blur,
			sizes,
			offset,
			threshold,
			lazy,
			wrapperClass,
			placeholderClass,
			blurhash,
			blurhashSize,
			className,
			loaded,
			load,
			decodeBlurhash
		];
	}

	class Image$1 extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$o, create_fragment$o, safe_not_equal, {
				c: 0,
				alt: 1,
				width: 2,
				height: 3,
				src: 4,
				srcset: 5,
				srcsetWebp: 6,
				ratio: 7,
				blur: 8,
				sizes: 9,
				offset: 10,
				threshold: 11,
				lazy: 12,
				wrapperClass: 13,
				placeholderClass: 14,
				blurhash: 15,
				blurhashSize: 16,
				class: 17
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Image",
				options,
				id: create_fragment$o.name
			});
		}

		get c() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set c(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get alt() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set alt(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get width() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set width(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get height() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set height(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get src() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set src(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get srcset() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set srcset(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get srcsetWebp() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set srcsetWebp(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get ratio() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set ratio(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get blur() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set blur(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sizes() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sizes(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get offset() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set offset(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get threshold() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set threshold(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get lazy() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set lazy(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get wrapperClass() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set wrapperClass(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get placeholderClass() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set placeholderClass(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get blurhash() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set blurhash(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get blurhashSize() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set blurhashSize(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get class() {
			throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Card.svelte generated by Svelte v4.2.20 */
	const file$m = "src/components/Card.svelte";

	function create_fragment$n(ctx) {
		let div;
		let div_class_value;
		let current;
		const default_slot_template = /*#slots*/ ctx[2].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				attr_dev(div, "class", div_class_value = "rounded shadow-lg bg-stone-200 dark:bg-zinc-500 bg-opacity-80 dark:bg-opacity-70 flex " + (/*cssClasses*/ ctx[0] || ''));
				add_location(div, file$m, 5, 0, 77);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[1],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*cssClasses*/ 1 && div_class_value !== (div_class_value = "rounded shadow-lg bg-stone-200 dark:bg-zinc-500 bg-opacity-80 dark:bg-opacity-70 flex " + (/*cssClasses*/ ctx[0] || ''))) {
					attr_dev(div, "class", div_class_value);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$n.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$n($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Card', slots, ['default']);
		let { class: cssClasses } = $$props;

		$$self.$$.on_mount.push(function () {
			if (cssClasses === undefined && !('class' in $$props || $$self.$$.bound[$$self.$$.props['class']])) {
				console.warn("<Card> was created without expected prop 'class'");
			}
		});

		const writable_props = ['class'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('class' in $$props) $$invalidate(0, cssClasses = $$props.class);
			if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ cssClasses });

		$$self.$inject_state = $$props => {
			if ('cssClasses' in $$props) $$invalidate(0, cssClasses = $$props.cssClasses);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [cssClasses, $$scope, slots];
	}

	class Card extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$n, create_fragment$n, safe_not_equal, { class: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Card",
				options,
				id: create_fragment$n.name
			});
		}

		get class() {
			throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Home/Person.svelte generated by Svelte v4.2.20 */
	const file$l = "src/components/Home/Person.svelte";

	// (7:0) <Card class="">
	function create_default_slot$9(ctx) {
		let div1;
		let div0;
		let image;
		let t;
		let current;

		image = new Image$1({
				props: {
					class: "rounded-full",
					src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTAgMjUwdjI1MGgxNWMxNSAwIDE1IDAgMTMtMnMtMi0yLTEtNGMyLTIgMi0yLTEtM2wtMi00YzAtMi0xLTItNS0yLTUgMC04LTEtMy0ybDQtMSAzLTIgMS0xIDEtMSAzLTJoNGMtMS0xIDAtMiAxLTJsMy0xYzktMiAxMS0yIDEyLTRsMi0xYzMgMSAxNS0xIDE3LTJsMi0yYzEgMCAyIDAgMS0xbDEtMWMzIDAgNiAwIDgtMmw1LTMgMTYtNSA2LTJoM2wtMy00Yy0zLTMtNC01LTQtOGwxLTQgMS0yIDEtMiAxLTIgMi0yIDItMiAyLTIgMi0xIDItMSAxLTFjMC0xMSA1LTMyIDgtMzVsMS05YzEtOSAzLTE2IDctMjIgMy01IDUtNCA0IDEgMCA1IDMgMjEgNSAyNGw0IDcgNyAxMCA0IDVhMjI2IDIyNiAwIDAwNTUgNDZsNCAzIDMgMiAzIDEgNiA0IDQgMyAyIDEgMSAxIDIgMWgxbDIgMiAyIDEgNCAzYzIgMSAzIDIgMiAzbDEgMWMxLTEgMiAwIDMgMWw0IDIgNCAzdjJjMSAxIDEgMS0xIDItMiAyLTEgMiAzIDAgMi0xIDUtMSA0IDEgMCAyIDEgMiAzIDJsMyAxYzAgMiAzIDQgNCAzaDJjMiAyIDcgMyA3IDJ2MWMwIDIgMyAyIDYtMWw1LTMgMy0zYzItMiAzLTIgNS0ybDEtMSAyLTIgMS0xdi0xbDQtM2E3NTggNzU4IDAgMDE3MC01OWw0LTQgMS0xIDUtMiA0LTMgMy0yYzEtMiA1LTMgNS0xIDEgMiA0IDEgNC0xbC0yLTJjLTItMS0yLTEgMC0xIDIgMSAzIDAgMy0xczYtNSA3LTRsLTEgMS0xIDNjMSAyIDAgMi0xIDJsLTQgMy0yIDR2MWMxIDAgMSAxLTEgMi0xIDEtMyAzLTMgNS0yIDMtMiA0LTUgNHMtMyAwLTIgMWMxIDIgMCAyLTIgMy0yIDAtMyAyLTMgMiAwIDItMSAyLTMgMXYyYzAgMyAwIDMtMSAyLTItMi02LTEtMTAgMi0zIDMtMyA0LTQgMTItMiAxMC00IDE0LTggMTVsLTIgMi00IDVhMTEwIDExMCAwIDAwLTEzIDEwIDI3MCAyNzAgMCAwMC0xNSA5bC0yIDItNSAyLTE2IDljLTMgMyAxIDIgNi0xbDEwLTUgNS0yLTQgNS01IDVoM2wyLTFjMC0yIDI1LTIzIDI4LTIzbDMtMyA3LTYgNC0zaDF2NGwtMSAxLTEgNGMtMSAzLTUgNy03IDdsLTIgMi0xIDEtMyAyLTYgNC0yIDItMyAyLTIgMi0yIDEtMyAyYy0xIDItMSAyIDcgMmg4bDYtNmM1LTUgNi02IDctNSAxIDIgMyAyIDMgMWwyLTIgMSA2LTEgNmgxOGMxNiAwIDE4IDAgMjItMnM2LTMgNC0xYy0zIDItMiAzIDEgMyA0IDAgMTAtMyAxMS01IDAtMiAwLTIgMS0xbDMgMWMyIDAgMiAwIDAgMWwtMiAyYzAgMiAzIDIgMjUgMiAyNSAwIDI2IDAgMjUtMmwxLTJ2LTFoLTJjMCAyLTMgMS0zLTFsMS0yIDEtMiAyLTUgNiA1YzUgNSA2IDUgNiAyczAtMyA0LTNjMyAwIDQgMCA0IDJsMiAyYTM2ODc1IDM2ODc1IDAgMDAzLTI0M1YwSDB2MjUwbTE2NSAxMTFsLTIgNS0yIDVjLTIgMi0zIDUtMiA1djNsMSAyYy0xIDIgMCAzIDEgMnYxbC0yIDNjMCAyIDAgMiAxIDFsMi0xIDMtMWMwLTEgMS0yIDMtMiAxIDAgMi0xIDItOHMwLTggMi04YzIgMSA0IDAgNC0yIDAtMy04LTctMTEtNW0yNzAgNjJjLTUgMS0xMiA2LTE2IDEybC01IDdjLTIgMi0zIDYtNCA5bC0yIDQtMyAzYy0zIDItMyA0IDAgNHYyaDJsNCAxYy0yIDIgMSAxIDUtMmw0LTQgMS0xYy0xLTEgMC0yIDEtMmwzLTIgMy0yIDItMmMyLTIgNS0zIDUtMXMzIDEgNC0xbDQtMjFjMC0yLTItNS00LTVsLTQgMW0tMjQyIDI5bDMgNWM1IDUgNiA3IDYgMTVzLTEgMTMtMiAxM2wtMTAtM2MtNC0xLTgtMi05LTFsMSAxIDUgM2E1NDIgNTQyIDAgMDAxMiAxMGwtMSAyYy0yIDAtNy00LTE0LTExLTEwLTEwLTExLTEwLTE4LTEybC0xMi01YTU5NiA1OTYgMCAwMC0zNy0xNWwtNS0zIDcgMTRjMiAyIDYgMyA4IDEgMS0yIDQtMSAxMCA0IDIgMyA1IDUgNiA1bDEgMWExODYgMTg2IDAgMDAzMyAyMWw3IDNjMiAwIDIgMCAwLTJsLTE0LTE0aDJsMyAyaDFsMyAzIDExIDZjNSA1IDE1IDcgMTYgM2wxLTIgMyAyYzMgMiA1IDIgMjEgMmwxNy0xLTctMmExNjUgMTY1IDAgMDEtMjktOGwtNC0zaDJsNSAyYzIgMCAzIDAgMy0ybC0xLTN2LTdsLTEtMnYtMmMtMSAxLTUtNy01LTEyLTEtNC04LTktMTQtMTAtNCAwLTQgMC00IDJNNTkgNDY3aDJsLTItMXYxbTEyIDB2MWgxYzAtMi0xLTItMS0xbTQxNyAzbDIgMmMzIDAgMi0yIDAtM2wtMiAxbS00MjYgMWwxIDFoMWMzIDAgMS0yLTEtMnMtMiAwLTEgMW01NSAybDEgM2MyIDEgMiAxIDItMWwtMS0zLTIgMW0tMzcgNGMwIDIgMCAzLTIgMy0xIDAtMiAxLTIgM2wyIDIgMiAyLTIgMS0yLTEtMi0xLTIgMSAyIDEgMSAxYzAgMyAyIDMgNCAyIDItMiAxMCAwIDEzIDJsMiAyIDUgM2MzIDIgNCAyIDE0IDIgMTIgMCAxMiAwIDEyLTJzMC0yLTItMmMtMiAxLTMgMC0zLTFsLTMtMS00LTEtMi0yLTYtMi0xMC03LTItMS0yLTEtNS0zYy00LTQtNi00LTYgMG00MDAgOGMwIDIgMSAzIDIgM2wxLTEtMS0zYy0yLTEtMi0xLTIgMW0tNDYwIDNoMmwtMi0xdjFtNDAyIDBsMSAxdi0xbC0xLTF2MW0tNyA2Yy0xIDEgMCAyIDEgMmwxLTItMS0yLTEgMm0tNDkgNWgxdi0ybC0xIDJtMTE0IDBsMiAxIDItMS0zLTEtMSAxIiBmaWxsPSIjMDAyZmE3IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=",
					srcset: "g/assets/avatar-400.jpg 375w",
					ratio: "100%",
					srcsetWebp: "g/assets/avatar-400.webp 375w"
				},
				$$inline: true
			});

		const default_slot_template = /*#slots*/ ctx[0].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

		const block = {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				create_component(image.$$.fragment);
				t = space();
				if (default_slot) default_slot.c();
				attr_dev(div0, "class", "p w-32 md:w-48 float-left mr-4");
				add_location(div0, file$l, 8, 8, 149);
				attr_dev(div1, "class", "p-6 lg:ml-5 ml-2");
				add_location(div1, file$l, 7, 4, 110);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				mount_component(image, div0, null);
				append_dev(div1, t);

				if (default_slot) {
					default_slot.m(div1, null);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[1],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(image.$$.fragment, local);
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(image.$$.fragment, local);
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				destroy_component(image);
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$9.name,
			type: "slot",
			source: "(7:0) <Card class=\\\"\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$m(ctx) {
		let card;
		let current;

		card = new Card({
				props: {
					class: "",
					$$slots: { default: [create_default_slot$9] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(card.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(card, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const card_changes = {};

				if (dirty & /*$$scope*/ 2) {
					card_changes.$$scope = { dirty, ctx };
				}

				card.$set(card_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(card.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(card.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(card, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$m.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$m($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Person', slots, ['default']);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Person> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ Image: Image$1, Card });
		return [slots, $$scope];
	}

	class Person extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Person",
				options,
				id: create_fragment$m.name
			});
		}
	}

	/* src/components/Home/Socials.svelte generated by Svelte v4.2.20 */
	const file$k = "src/components/Home/Socials.svelte";

	// (7:0) <Card class="p-6 flex justify-around">
	function create_default_slot$8(ctx) {
		let a0;
		let svg0;
		let path0;
		let t0;
		let a1;
		let svg1;
		let path1;
		let path2;
		let t1;
		let a2;
		let svg2;
		let path3;
		let t2;
		let a3;
		let svg3;
		let path4;

		const block = {
			c: function create() {
				a0 = element("a");
				svg0 = svg_element("svg");
				path0 = svg_element("path");
				t0 = space();
				a1 = element("a");
				svg1 = svg_element("svg");
				path1 = svg_element("path");
				path2 = svg_element("path");
				t1 = space();
				a2 = element("a");
				svg2 = svg_element("svg");
				path3 = svg_element("path");
				t2 = space();
				a3 = element("a");
				svg3 = svg_element("svg");
				path4 = svg_element("path");
				attr_dev(path0, "fill-rule", "evenodd");
				attr_dev(path0, "d", "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z");
				add_location(path0, file$k, 9, 12, 337);
				attr_dev(svg0, "height", "50");
				attr_dev(svg0, "width", "50");
				attr_dev(svg0, "aria-hidden", "true");
				attr_dev(svg0, "viewBox", "0 0 16 16");
				attr_dev(svg0, "data-view-component", "true");
				attr_dev(svg0, "class", "svelte-x4jbua");
				add_location(svg0, file$k, 8, 8, 230);
				attr_dev(a0, "href", "https://github.com/DriesMeerman/");
				attr_dev(a0, "class", "cursor-pointer dark:fill-white svelte-x4jbua");
				attr_dev(a0, "aria-label", "Github");
				attr_dev(a0, "title", "Github");
				add_location(a0, file$k, 7, 4, 104);
				set_style(path1, "fill-rule", "evenodd");
				set_style(path1, "clip-rule", "evenodd");
				attr_dev(path1, "d", "M246.4,204.35v-0.665c-0.136,0.223-0.324,0.446-0.442,0.665H246.4z");
				add_location(path1, file$k, 16, 12, 1370);
				set_style(path2, "fill-rule", "evenodd");
				set_style(path2, "clip-rule", "evenodd");
				attr_dev(path2, "d", "M0,0v455h455V0H0z M141.522,378.002H74.016V174.906h67.506V378.002z\n             M107.769,147.186h-0.446C84.678,147.186,70,131.585,70,112.085c0-19.928,15.107-35.087,38.211-35.087\n            c23.109,0,37.31,15.159,37.752,35.087C145.963,131.585,131.32,147.186,107.769,147.186z M385,378.002h-67.524V269.345\n            c0-27.291-9.756-45.92-34.195-45.92c-18.664,0-29.755,12.543-34.641,24.693c-1.776,4.34-2.24,10.373-2.24,16.459v113.426h-67.537\n            c0,0,0.905-184.043,0-203.096H246.4v28.779c8.973-13.807,24.986-33.547,60.856-33.547c44.437,0,77.744,29.02,77.744,91.398V378.002\n            z");
				add_location(path2, file$k, 17, 16, 1508);
				attr_dev(svg1, "height", "50");
				attr_dev(svg1, "width", "50");
				attr_dev(svg1, "version", "1.1");
				attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg1, "xmlns:xlink", "http://www.w3.org/1999/xlink");
				attr_dev(svg1, "x", "0px");
				attr_dev(svg1, "y", "0px");
				attr_dev(svg1, "viewBox", "0 0 455 455");
				set_style(svg1, "enable-background", "new 0 0 455 455");
				attr_dev(svg1, "xml:space", "preserve");
				attr_dev(svg1, "class", "svelte-x4jbua");
				add_location(svg1, file$k, 14, 8, 1122);
				attr_dev(a1, "href", "https://www.linkedin.com/in/dries-meerman-34ba79a4/");
				attr_dev(a1, "class", "cursor-pointer dark:fill-white svelte-x4jbua");
				attr_dev(a1, "aria-label", "LinkedIn");
				attr_dev(a1, "title", "LinkedIn");
				add_location(a1, file$k, 13, 4, 973);
				attr_dev(path3, "d", "M15 21h-10v-2h10v2zm6-11.665l-1.621-9.335-1.993.346 1.62 9.335 1.994-.346zm-5.964 6.937l-9.746-.975-.186 2.016 9.755.879.177-1.92zm.538-2.587l-9.276-2.608-.526 1.954 9.306 2.5.496-1.846zm1.204-2.413l-8.297-4.864-1.029 1.743 8.298 4.865 1.028-1.744zm1.866-1.467l-5.339-7.829-1.672 1.14 5.339 7.829 1.672-1.14zm-2.644 4.195v8h-12v-8h-2v10h16v-10h-2z");
				add_location(path3, file$k, 28, 68, 2446);
				attr_dev(svg2, "width", "50");
				attr_dev(svg2, "height", "50");
				attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg2, "viewBox", "0 0 24 24");
				attr_dev(svg2, "class", "svelte-x4jbua");
				add_location(svg2, file$k, 27, 8, 2350);
				attr_dev(a2, "href", "https://stackoverflow.com/users/6173612/dries-meerman");
				attr_dev(a2, "class", "cursor-pointer dark:fill-white svelte-x4jbua");
				attr_dev(a2, "aria-label", "Stack Overflow");
				attr_dev(a2, "title", "Stick Overflow");
				add_location(a2, file$k, 26, 4, 2187);
				attr_dev(path4, "d", "M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805zm36.254 0C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745z");
				add_location(path4, file$k, 32, 100, 3045);
				attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg3, "viewBox", "0 -3.268 64 68.414");
				attr_dev(svg3, "width", "50");
				attr_dev(svg3, "height", "50");
				attr_dev(svg3, "class", "svelte-x4jbua");
				add_location(svg3, file$k, 32, 8, 2953);
				attr_dev(a3, "href", "https://bsky.app/profile/chrozera.xyz");
				attr_dev(a3, "class", "cursor-pointer dark:fill-white svelte-x4jbua");
				attr_dev(a3, "aria-label", "Bsky");
				attr_dev(a3, "title", "Bsky");
				add_location(a3, file$k, 31, 4, 2826);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a0, anchor);
				append_dev(a0, svg0);
				append_dev(svg0, path0);
				insert_dev(target, t0, anchor);
				insert_dev(target, a1, anchor);
				append_dev(a1, svg1);
				append_dev(svg1, path1);
				append_dev(svg1, path2);
				insert_dev(target, t1, anchor);
				insert_dev(target, a2, anchor);
				append_dev(a2, svg2);
				append_dev(svg2, path3);
				insert_dev(target, t2, anchor);
				insert_dev(target, a3, anchor);
				append_dev(a3, svg3);
				append_dev(svg3, path4);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(a0);
					detach_dev(t0);
					detach_dev(a1);
					detach_dev(t1);
					detach_dev(a2);
					detach_dev(t2);
					detach_dev(a3);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$8.name,
			type: "slot",
			source: "(7:0) <Card class=\\\"p-6 flex justify-around\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$l(ctx) {
		let card;
		let current;

		card = new Card({
				props: {
					class: "p-6 flex justify-around",
					$$slots: { default: [create_default_slot$8] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(card.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(card, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const card_changes = {};

				if (dirty & /*$$scope*/ 1) {
					card_changes.$$scope = { dirty, ctx };
				}

				card.$set(card_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(card.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(card.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(card, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$l.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$l($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Socials', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Socials> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ Card });
		return [];
	}

	class Socials extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Socials",
				options,
				id: create_fragment$l.name
			});
		}
	}

	/* src/routes/Home.svelte generated by Svelte v4.2.20 */
	const file$j = "src/routes/Home.svelte";

	// (7:0) <Person>
	function create_default_slot$7(ctx) {
		let p;
		let t0;
		let a;
		let t2;
		let br0;
		let br1;
		let t3;
		let br2;
		let br3;
		let t4;

		const block = {
			c: function create() {
				p = element("p");
				t0 = text("My name is Dries Meerman, I'm a Software Engineer, technologist and nerd.\n        My interrest in technology started early with a Game Boy Color which I used to mainly play Pokemon Gold.\n        This gaming journey eventually let me to Minecraft and specifically a mod called ComputerCraft which allowed\n        me to automate things in the game using ");
				a = element("a");
				a.textContent = "Lua";
				t2 = text(". ");
				br0 = element("br");
				br1 = element("br");
				t3 = text("\n        Programming from that point on became the thing I wanted to keep doing and get good at.\n        After high school this led me to do a bachelor degree majoring in Software Engineering.\n        While studying there was a lot of opportunity to connect with the development industry, this gave me the chance to start working before I graduated.\n        I really enjoy the problem solving process of development and breaking up problems into smaller solvable chunks.\n        During my career I've enjoyed building systems rather than specific features that can be configured to allow them to be used in flexible rather than in rigid ways. ");
				br2 = element("br");
				br3 = element("br");
				t4 = text("\n\n        My profession primarily involves desk-based work, to balance this out a I like going to the gym to get physical energy out and keep my endurance up.\n        In the summers I enjoy to go longboarding gliding across preferably smooth paths.\n        I'm also a hobbyist 3D printer, it is a great intersection between digital and physical.\n        It can be practical but I mainly enjoy printing small trinkets found online as my 3D modelling skills could be improved.");
				attr_dev(a, "class", "underline");
				attr_dev(a, "href", "https://lua.org/");
				add_location(a, file$j, 11, 48, 551);
				add_location(br0, file$j, 11, 102, 605);
				add_location(br1, file$j, 11, 107, 610);
				add_location(br2, file$j, 16, 172, 1258);
				add_location(br3, file$j, 16, 177, 1263);
				attr_dev(p, "class", "max-w-3/4 sm:text-justify");
				add_location(p, file$j, 7, 4, 153);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
				append_dev(p, t0);
				append_dev(p, a);
				append_dev(p, t2);
				append_dev(p, br0);
				append_dev(p, br1);
				append_dev(p, t3);
				append_dev(p, br2);
				append_dev(p, br3);
				append_dev(p, t4);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$7.name,
			type: "slot",
			source: "(7:0) <Person>",
			ctx
		});

		return block;
	}

	function create_fragment$k(ctx) {
		let person;
		let t0;
		let div;
		let socials;
		let t1;
		let meta0;
		let meta1;
		let meta2;
		let current;

		person = new Person({
				props: {
					$$slots: { default: [create_default_slot$7] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		socials = new Socials({ $$inline: true });

		const block = {
			c: function create() {
				create_component(person.$$.fragment);
				t0 = space();
				div = element("div");
				create_component(socials.$$.fragment);
				t1 = space();
				meta0 = element("meta");
				meta1 = element("meta");
				meta2 = element("meta");
				attr_dev(div, "class", "mt-12");
				add_location(div, file$j, 25, 0, 1763);
				document.title = "Meerman";
				attr_dev(meta0, "name", "description");
				attr_dev(meta0, "content", "A website showcasing Dries Meerman's skills, education, and experience he has accumulated over the years.");
				add_location(meta0, file$j, 31, 4, 1860);
				attr_dev(meta1, "name", "author");
				attr_dev(meta1, "content", "Dries Meerman");
				add_location(meta1, file$j, 32, 4, 2006);
				attr_dev(meta2, "name", "keywords");
				attr_dev(meta2, "content", "Dries Meerman, Meerman, Software Engineer, Software Engineering");
				add_location(meta2, file$j, 33, 4, 2055);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(person, target, anchor);
				insert_dev(target, t0, anchor);
				insert_dev(target, div, anchor);
				mount_component(socials, div, null);
				insert_dev(target, t1, anchor);
				append_dev(document.head, meta0);
				append_dev(document.head, meta1);
				append_dev(document.head, meta2);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const person_changes = {};

				if (dirty & /*$$scope*/ 1) {
					person_changes.$$scope = { dirty, ctx };
				}

				person.$set(person_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(person.$$.fragment, local);
				transition_in(socials.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(person.$$.fragment, local);
				transition_out(socials.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(div);
					detach_dev(t1);
				}

				destroy_component(person, detaching);
				destroy_component(socials);
				detach_dev(meta0);
				detach_dev(meta1);
				detach_dev(meta2);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$k.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$k($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Home', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ Person, Socials });
		return [];
	}

	class Home extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Home",
				options,
				id: create_fragment$k.name
			});
		}
	}

	/* node_modules/svelte-vertical-timeline/components/Timeline.svelte generated by Svelte v4.2.20 */
	const file$i = "node_modules/svelte-vertical-timeline/components/Timeline.svelte";

	function create_fragment$j(ctx) {
		let ul;
		let current;
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

		const block = {
			c: function create() {
				ul = element("ul");
				if (default_slot) default_slot.c();
				attr_dev(ul, "class", "timeline svelte-1qx6lg0");
				attr_dev(ul, "style", /*style*/ ctx[0]);
				add_location(ul, file$i, 6, 0, 171);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, ul, anchor);

				if (default_slot) {
					default_slot.m(ul, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*style*/ 1) {
					attr_dev(ul, "style", /*style*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(ul);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$j.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$j($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Timeline', slots, ['default']);
		let { position = 'right' } = $$props;
		let { style = null } = $$props;
		setContext('TimelineConfig', { rootPosition: position });
		const writable_props = ['position', 'style'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Timeline> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('position' in $$props) $$invalidate(1, position = $$props.position);
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
			if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ setContext, position, style });

		$$self.$inject_state = $$props => {
			if ('position' in $$props) $$invalidate(1, position = $$props.position);
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, position, $$scope, slots];
	}

	class Timeline extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$j, create_fragment$j, safe_not_equal, { position: 1, style: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Timeline",
				options,
				id: create_fragment$j.name
			});
		}

		get position() {
			throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set position(value) {
			throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get style() {
			throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/svelte-vertical-timeline/components/TimelineItem.svelte generated by Svelte v4.2.20 */
	const file$h = "node_modules/svelte-vertical-timeline/components/TimelineItem.svelte";
	const get_opposite_content_slot_changes = dirty => ({});
	const get_opposite_content_slot_context = ctx => ({});

	// (12:1) {:else}
	function create_else_block$4(ctx) {
		let current;
		const opposite_content_slot_template = /*#slots*/ ctx[5]["opposite-content"];
		const opposite_content_slot = create_slot(opposite_content_slot_template, ctx, /*$$scope*/ ctx[4], get_opposite_content_slot_context);

		const block = {
			c: function create() {
				if (opposite_content_slot) opposite_content_slot.c();
			},
			m: function mount(target, anchor) {
				if (opposite_content_slot) {
					opposite_content_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (opposite_content_slot) {
					if (opposite_content_slot.p && (!current || dirty & /*$$scope*/ 16)) {
						update_slot_base(
							opposite_content_slot,
							opposite_content_slot_template,
							ctx,
							/*$$scope*/ ctx[4],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
							: get_slot_changes(opposite_content_slot_template, /*$$scope*/ ctx[4], dirty, get_opposite_content_slot_changes),
							get_opposite_content_slot_context
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(opposite_content_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(opposite_content_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (opposite_content_slot) opposite_content_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$4.name,
			type: "else",
			source: "(12:1) {:else}",
			ctx
		});

		return block;
	}

	// (10:1) {#if !$$slots['opposite-content']}
	function create_if_block$5(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				attr_dev(div, "class", "opposite-block svelte-77d8h8");
				add_location(div, file$h, 10, 2, 366);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$5.name,
			type: "if",
			source: "(10:1) {#if !$$slots['opposite-content']}",
			ctx
		});

		return block;
	}

	function create_fragment$i(ctx) {
		let li;
		let current_block_type_index;
		let if_block;
		let t;
		let current;
		const if_block_creators = [create_if_block$5, create_else_block$4];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (!/*$$slots*/ ctx[2]['opposite-content']) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		const default_slot_template = /*#slots*/ ctx[5].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

		const block = {
			c: function create() {
				li = element("li");
				if_block.c();
				t = space();
				if (default_slot) default_slot.c();
				attr_dev(li, "class", "" + (null_to_empty(`timeline-item ${/*itemPosition*/ ctx[1]}`) + " svelte-77d8h8"));
				attr_dev(li, "style", /*style*/ ctx[0]);
				add_location(li, file$h, 8, 0, 275);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				if_blocks[current_block_type_index].m(li, null);
				append_dev(li, t);

				if (default_slot) {
					default_slot.m(li, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(li, t);
				}

				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[4],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*style*/ 1) {
					attr_dev(li, "style", /*style*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(li);
				}

				if_blocks[current_block_type_index].d();
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$i.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$i($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TimelineItem', slots, ['opposite-content','default']);
		const $$slots = compute_slots(slots);
		let { position = null } = $$props;
		let { style = null } = $$props;
		const config = getContext('TimelineConfig');
		const itemPosition = position ? position : config.rootPosition;
		setContext('ParentPosition', itemPosition);
		const writable_props = ['position', 'style'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimelineItem> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('position' in $$props) $$invalidate(3, position = $$props.position);
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
			if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			getContext,
			setContext,
			position,
			style,
			config,
			itemPosition
		});

		$$self.$inject_state = $$props => {
			if ('position' in $$props) $$invalidate(3, position = $$props.position);
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, itemPosition, $$slots, position, $$scope, slots];
	}

	class TimelineItem extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$i, create_fragment$i, safe_not_equal, { position: 3, style: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TimelineItem",
				options,
				id: create_fragment$i.name
			});
		}

		get position() {
			throw new Error("<TimelineItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set position(value) {
			throw new Error("<TimelineItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get style() {
			throw new Error("<TimelineItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<TimelineItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/svelte-vertical-timeline/components/TimelineSeparator.svelte generated by Svelte v4.2.20 */
	const file$g = "node_modules/svelte-vertical-timeline/components/TimelineSeparator.svelte";

	function create_fragment$h(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[2].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				attr_dev(div, "class", "timeline-separator svelte-6e6s8c");
				attr_dev(div, "style", /*style*/ ctx[0]);
				add_location(div, file$g, 3, 0, 45);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[1],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*style*/ 1) {
					attr_dev(div, "style", /*style*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$h.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$h($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TimelineSeparator', slots, ['default']);
		let { style = null } = $$props;
		const writable_props = ['style'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimelineSeparator> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
			if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ style });

		$$self.$inject_state = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, $$scope, slots];
	}

	class TimelineSeparator extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$h, create_fragment$h, safe_not_equal, { style: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TimelineSeparator",
				options,
				id: create_fragment$h.name
			});
		}

		get style() {
			throw new Error("<TimelineSeparator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<TimelineSeparator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/svelte-vertical-timeline/components/TimelineDot.svelte generated by Svelte v4.2.20 */
	const file$f = "node_modules/svelte-vertical-timeline/components/TimelineDot.svelte";

	function create_fragment$g(ctx) {
		let span;
		let current;
		const default_slot_template = /*#slots*/ ctx[2].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

		const block = {
			c: function create() {
				span = element("span");
				if (default_slot) default_slot.c();
				attr_dev(span, "class", "timeline-dot svelte-1ggf9p1");
				attr_dev(span, "style", /*style*/ ctx[0]);
				add_location(span, file$f, 3, 0, 45);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);

				if (default_slot) {
					default_slot.m(span, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[1],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*style*/ 1) {
					attr_dev(span, "style", /*style*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$g.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$g($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TimelineDot', slots, ['default']);
		let { style = null } = $$props;
		const writable_props = ['style'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimelineDot> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
			if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ style });

		$$self.$inject_state = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, $$scope, slots];
	}

	class TimelineDot extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$g, create_fragment$g, safe_not_equal, { style: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TimelineDot",
				options,
				id: create_fragment$g.name
			});
		}

		get style() {
			throw new Error("<TimelineDot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<TimelineDot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/svelte-vertical-timeline/components/TimelineConnector.svelte generated by Svelte v4.2.20 */
	const file$e = "node_modules/svelte-vertical-timeline/components/TimelineConnector.svelte";

	function create_fragment$f(ctx) {
		let span;

		const block = {
			c: function create() {
				span = element("span");
				attr_dev(span, "class", "timeline-connector svelte-1usms3k");
				attr_dev(span, "style", /*style*/ ctx[0]);
				add_location(span, file$e, 3, 0, 45);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*style*/ 1) {
					attr_dev(span, "style", /*style*/ ctx[0]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$f.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$f($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TimelineConnector', slots, []);
		let { style = null } = $$props;
		const writable_props = ['style'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimelineConnector> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		$$self.$capture_state = () => ({ style });

		$$self.$inject_state = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style];
	}

	class TimelineConnector extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$f, create_fragment$f, safe_not_equal, { style: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TimelineConnector",
				options,
				id: create_fragment$f.name
			});
		}

		get style() {
			throw new Error("<TimelineConnector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<TimelineConnector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/svelte-vertical-timeline/components/TimelineContent.svelte generated by Svelte v4.2.20 */
	const file$d = "node_modules/svelte-vertical-timeline/components/TimelineContent.svelte";

	function create_fragment$e(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				attr_dev(div, "class", "" + (null_to_empty(`timeline-content ${/*itemPosition*/ ctx[1]}`) + " svelte-ov1kt8"));
				attr_dev(div, "style", /*style*/ ctx[0]);
				add_location(div, file$d, 7, 0, 256);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*style*/ 1) {
					attr_dev(div, "style", /*style*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$e.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$e($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TimelineContent', slots, ['default']);
		let { style = null } = $$props;
		const config = getContext('TimelineConfig');
		const parentPosition = getContext('ParentPosition');
		const itemPosition = parentPosition ? parentPosition : config.rootPosition;
		const writable_props = ['style'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimelineContent> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
			if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			getContext,
			style,
			config,
			parentPosition,
			itemPosition
		});

		$$self.$inject_state = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, itemPosition, $$scope, slots];
	}

	class TimelineContent extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$e, create_fragment$e, safe_not_equal, { style: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TimelineContent",
				options,
				id: create_fragment$e.name
			});
		}

		get style() {
			throw new Error("<TimelineContent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<TimelineContent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/svelte-vertical-timeline/components/TimelineOppositeContent.svelte generated by Svelte v4.2.20 */
	const file$c = "node_modules/svelte-vertical-timeline/components/TimelineOppositeContent.svelte";

	function create_fragment$d(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				attr_dev(div, "class", "" + (null_to_empty(`timeline-opposite-content ${/*itemPosition*/ ctx[1]}`) + " svelte-r6jwvl"));
				attr_dev(div, "style", /*style*/ ctx[0]);
				add_location(div, file$c, 7, 0, 256);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*style*/ 1) {
					attr_dev(div, "style", /*style*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$d.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$d($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TimelineOppositeContent', slots, ['default']);
		let { style = null } = $$props;
		const config = getContext('TimelineConfig');
		const parentPosition = getContext('ParentPosition');
		const itemPosition = parentPosition ? parentPosition : config.rootPosition;
		const writable_props = ['style'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimelineOppositeContent> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
			if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			getContext,
			style,
			config,
			parentPosition,
			itemPosition
		});

		$$self.$inject_state = $$props => {
			if ('style' in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, itemPosition, $$scope, slots];
	}

	class TimelineOppositeContent extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$d, create_fragment$d, safe_not_equal, { style: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TimelineOppositeContent",
				options,
				id: create_fragment$d.name
			});
		}

		get style() {
			throw new Error("<TimelineOppositeContent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<TimelineOppositeContent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/StyledTimeLine.svelte generated by Svelte v4.2.20 */

	const file_1 = "src/components/StyledTimeLine.svelte";

	function get_each_context$4(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[3] = list[i];
		return child_ctx;
	}

	function get_each_context_1$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[6] = list[i];
		return child_ctx;
	}

	function get_each_context_2$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[9] = list[i];
		return child_ctx;
	}

	// (21:0) {:else}
	function create_else_block$3(ctx) {
		let timeline;
		let current;

		timeline = new Timeline({
				props: {
					position: /*innerWidth*/ ctx[1] < 640 ? 'right' : 'alternate',
					$$slots: { default: [create_default_slot$6] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(timeline.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(timeline, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const timeline_changes = {};
				if (dirty & /*innerWidth*/ 2) timeline_changes.position = /*innerWidth*/ ctx[1] < 640 ? 'right' : 'alternate';

				if (dirty & /*$$scope, timeLineItems*/ 4097) {
					timeline_changes.$$scope = { dirty, ctx };
				}

				timeline.$set(timeline_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(timeline.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(timeline.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(timeline, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$3.name,
			type: "else",
			source: "(21:0) {:else}",
			ctx
		});

		return block;
	}

	// (19:0) {#if innerWidth === 0}
	function create_if_block$4(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				div.textContent = "place holder";
				add_location(div, file_1, 19, 4, 382);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$4.name,
			type: "if",
			source: "(19:0) {#if innerWidth === 0}",
			ctx
		});

		return block;
	}

	// (28:16) <TimelineSeparator>
	function create_default_slot_4(ctx) {
		let timelinedot;
		let t;
		let timelineconnector;
		let current;
		timelinedot = new TimelineDot({ $$inline: true });
		timelineconnector = new TimelineConnector({ $$inline: true });

		const block = {
			c: function create() {
				create_component(timelinedot.$$.fragment);
				t = space();
				create_component(timelineconnector.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(timelinedot, target, anchor);
				insert_dev(target, t, anchor);
				mount_component(timelineconnector, target, anchor);
				current = true;
			},
			i: function intro(local) {
				if (current) return;
				transition_in(timelinedot.$$.fragment, local);
				transition_in(timelineconnector.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(timelinedot.$$.fragment, local);
				transition_out(timelineconnector.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}

				destroy_component(timelinedot, detaching);
				destroy_component(timelineconnector, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_4.name,
			type: "slot",
			source: "(28:16) <TimelineSeparator>",
			ctx
		});

		return block;
	}

	// (35:28) {#if item.image}
	function create_if_block_2$1(ctx) {
		let div;
		let img;
		let img_src_value;
		let img_alt_value;

		const block = {
			c: function create() {
				div = element("div");
				img = element("img");
				attr_dev(img, "class", "h-full w-full object-cover absolute");
				if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[3].image)) attr_dev(img, "src", img_src_value);
				attr_dev(img, "alt", img_alt_value = /*item*/ ctx[3].title + " logo");
				add_location(img, file_1, 36, 36, 1132);
				attr_dev(div, "class", "mx-2 relative thumbnail-holder self-center svelte-13zkidn");
				add_location(div, file_1, 35, 28, 1038);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, img);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*timeLineItems*/ 1 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[3].image)) {
					attr_dev(img, "src", img_src_value);
				}

				if (dirty & /*timeLineItems*/ 1 && img_alt_value !== (img_alt_value = /*item*/ ctx[3].title + " logo")) {
					attr_dev(img, "alt", img_alt_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$1.name,
			type: "if",
			source: "(35:28) {#if item.image}",
			ctx
		});

		return block;
	}

	// (50:32) {#if item.bullets && item.bullets.length > 0 }
	function create_if_block_1$3(ctx) {
		let ul;
		let each_value_2 = ensure_array_like_dev(/*item*/ ctx[3].bullets);
		let each_blocks = [];

		for (let i = 0; i < each_value_2.length; i += 1) {
			each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
		}

		const block = {
			c: function create() {
				ul = element("ul");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(ul, "class", "list list-disc text-left ml-4 mt-1 text-sm");
				add_location(ul, file_1, 50, 36, 1863);
			},
			m: function mount(target, anchor) {
				insert_dev(target, ul, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(ul, null);
					}
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*timeLineItems*/ 1) {
					each_value_2 = ensure_array_like_dev(/*item*/ ctx[3].bullets);
					let i;

					for (i = 0; i < each_value_2.length; i += 1) {
						const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_2$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ul, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_2.length;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(ul);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$3.name,
			type: "if",
			source: "(50:32) {#if item.bullets && item.bullets.length > 0 }",
			ctx
		});

		return block;
	}

	// (52:40) {#each item.bullets as bullet}
	function create_each_block_2$1(ctx) {
		let li;
		let t_value = /*bullet*/ ctx[9] + "";
		let t;

		const block = {
			c: function create() {
				li = element("li");
				t = text(t_value);
				add_location(li, file_1, 52, 44, 2036);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				append_dev(li, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*timeLineItems*/ 1 && t_value !== (t_value = /*bullet*/ ctx[9] + "")) set_data_dev(t, t_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(li);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_2$1.name,
			type: "each",
			source: "(52:40) {#each item.bullets as bullet}",
			ctx
		});

		return block;
	}

	// (58:36) {#each item.attachments || [] as file}
	function create_each_block_1$2(ctx) {
		let div1;
		let a;
		let div0;
		let img;
		let img_src_value;
		let t0;
		let p;
		let t1_value = /*file*/ ctx[6].title + "";
		let t1;
		let a_href_value;
		let t2;

		const block = {
			c: function create() {
				div1 = element("div");
				a = element("a");
				div0 = element("div");
				img = element("img");
				t0 = space();
				p = element("p");
				t1 = text(t1_value);
				t2 = space();
				attr_dev(img, "class", "h-full");
				if (!src_url_equal(img.src, img_src_value = /*file*/ ctx[6].image)) attr_dev(img, "src", img_src_value);
				attr_dev(img, "alt", "");
				add_location(img, file_1, 61, 52, 2634);
				attr_dev(p, "class", "text-xs");
				add_location(p, file_1, 62, 52, 2734);
				attr_dev(div0, "class", "h-11 m-4 flex flex-row content-center flex-col");
				add_location(div0, file_1, 60, 48, 2520);
				attr_dev(a, "href", a_href_value = /*file*/ ctx[6].url);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				add_location(a, file_1, 59, 44, 2407);
				add_location(div1, file_1, 58, 40, 2356);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, a);
				append_dev(a, div0);
				append_dev(div0, img);
				append_dev(div0, t0);
				append_dev(div0, p);
				append_dev(p, t1);
				append_dev(div1, t2);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*timeLineItems*/ 1 && !src_url_equal(img.src, img_src_value = /*file*/ ctx[6].image)) {
					attr_dev(img, "src", img_src_value);
				}

				if (dirty & /*timeLineItems*/ 1 && t1_value !== (t1_value = /*file*/ ctx[6].title + "")) set_data_dev(t1, t1_value);

				if (dirty & /*timeLineItems*/ 1 && a_href_value !== (a_href_value = /*file*/ ctx[6].url)) {
					attr_dev(a, "href", a_href_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1$2.name,
			type: "each",
			source: "(58:36) {#each item.attachments || [] as file}",
			ctx
		});

		return block;
	}

	// (32:16) <TimelineContent>
	function create_default_slot_3(ctx) {
		let div6;
		let div1;
		let t0;
		let div0;
		let h10;
		let t1_value = /*item*/ ctx[3].title + "";
		let t1;
		let t2;
		let h11;
		let t3_value = (/*item*/ ctx[3].subtitle || '') + "";
		let t3;
		let t4;
		let div5;
		let div4;
		let div2;
		let t5_value = (/*item*/ ctx[3].description || '') + "";
		let t5;
		let t6;
		let t7;
		let div3;
		let if_block0 = /*item*/ ctx[3].image && create_if_block_2$1(ctx);
		let if_block1 = /*item*/ ctx[3].bullets && /*item*/ ctx[3].bullets.length > 0 && create_if_block_1$3(ctx);
		let each_value_1 = ensure_array_like_dev(/*item*/ ctx[3].attachments || []);
		let each_blocks = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
		}

		const block = {
			c: function create() {
				div6 = element("div");
				div1 = element("div");
				if (if_block0) if_block0.c();
				t0 = space();
				div0 = element("div");
				h10 = element("h1");
				t1 = text(t1_value);
				t2 = space();
				h11 = element("h1");
				t3 = text(t3_value);
				t4 = space();
				div5 = element("div");
				div4 = element("div");
				div2 = element("div");
				t5 = text(t5_value);
				t6 = space();
				if (if_block1) if_block1.c();
				t7 = space();
				div3 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				add_location(h10, file_1, 40, 32, 1381);
				attr_dev(h11, "class", "text-sm");
				add_location(h11, file_1, 41, 32, 1437);
				attr_dev(div0, "class", "mb-2");
				add_location(div0, file_1, 39, 28, 1329);
				attr_dev(div1, "class", "flex");
				add_location(div1, file_1, 33, 24, 944);
				attr_dev(div2, "class", "text-sm");
				add_location(div2, file_1, 48, 32, 1694);
				attr_dev(div3, "class", "flex");
				add_location(div3, file_1, 56, 32, 2220);
				attr_dev(div4, "class", "mx-1 max-w-[80%]");
				add_location(div4, file_1, 47, 28, 1629);
				attr_dev(div5, "class", "flex");
				add_location(div5, file_1, 45, 24, 1579);
				add_location(div6, file_1, 32, 20, 913);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div6, anchor);
				append_dev(div6, div1);
				if (if_block0) if_block0.m(div1, null);
				append_dev(div1, t0);
				append_dev(div1, div0);
				append_dev(div0, h10);
				append_dev(h10, t1);
				append_dev(div0, t2);
				append_dev(div0, h11);
				append_dev(h11, t3);
				append_dev(div6, t4);
				append_dev(div6, div5);
				append_dev(div5, div4);
				append_dev(div4, div2);
				append_dev(div2, t5);
				append_dev(div4, t6);
				if (if_block1) if_block1.m(div4, null);
				append_dev(div4, t7);
				append_dev(div4, div3);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div3, null);
					}
				}
			},
			p: function update(ctx, dirty) {
				if (/*item*/ ctx[3].image) {
					if (if_block0) {
						if_block0.p(ctx, dirty);
					} else {
						if_block0 = create_if_block_2$1(ctx);
						if_block0.c();
						if_block0.m(div1, t0);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (dirty & /*timeLineItems*/ 1 && t1_value !== (t1_value = /*item*/ ctx[3].title + "")) set_data_dev(t1, t1_value);
				if (dirty & /*timeLineItems*/ 1 && t3_value !== (t3_value = (/*item*/ ctx[3].subtitle || '') + "")) set_data_dev(t3, t3_value);
				if (dirty & /*timeLineItems*/ 1 && t5_value !== (t5_value = (/*item*/ ctx[3].description || '') + "")) set_data_dev(t5, t5_value);

				if (/*item*/ ctx[3].bullets && /*item*/ ctx[3].bullets.length > 0) {
					if (if_block1) {
						if_block1.p(ctx, dirty);
					} else {
						if_block1 = create_if_block_1$3(ctx);
						if_block1.c();
						if_block1.m(div4, t7);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (dirty & /*timeLineItems*/ 1) {
					each_value_1 = ensure_array_like_dev(/*item*/ ctx[3].attachments || []);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_1$2(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div3, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_1.length;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div6);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_3.name,
			type: "slot",
			source: "(32:16) <TimelineContent>",
			ctx
		});

		return block;
	}

	// (24:12) <TimelineItem>
	function create_default_slot_2(ctx) {
		let timelineseparator;
		let t0;
		let timelinecontent;
		let t1;
		let current;

		timelineseparator = new TimelineSeparator({
				props: {
					$$slots: { default: [create_default_slot_4] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		timelinecontent = new TimelineContent({
				props: {
					$$slots: { default: [create_default_slot_3] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(timelineseparator.$$.fragment);
				t0 = space();
				create_component(timelinecontent.$$.fragment);
				t1 = space();
			},
			m: function mount(target, anchor) {
				mount_component(timelineseparator, target, anchor);
				insert_dev(target, t0, anchor);
				mount_component(timelinecontent, target, anchor);
				insert_dev(target, t1, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const timelineseparator_changes = {};

				if (dirty & /*$$scope*/ 4096) {
					timelineseparator_changes.$$scope = { dirty, ctx };
				}

				timelineseparator.$set(timelineseparator_changes);
				const timelinecontent_changes = {};

				if (dirty & /*$$scope, timeLineItems*/ 4097) {
					timelinecontent_changes.$$scope = { dirty, ctx };
				}

				timelinecontent.$set(timelinecontent_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(timelineseparator.$$.fragment, local);
				transition_in(timelinecontent.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(timelineseparator.$$.fragment, local);
				transition_out(timelinecontent.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
				}

				destroy_component(timelineseparator, detaching);
				destroy_component(timelinecontent, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_2.name,
			type: "slot",
			source: "(24:12) <TimelineItem>",
			ctx
		});

		return block;
	}

	// (25:16) <TimelineOppositeContent slot="opposite-content">
	function create_default_slot_1$1(ctx) {
		let t0_value = (/*item*/ ctx[3].date || '') + "";
		let t0;
		let t1;

		const block = {
			c: function create() {
				t0 = text(t0_value);
				t1 = space();
			},
			m: function mount(target, anchor) {
				insert_dev(target, t0, anchor);
				insert_dev(target, t1, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*timeLineItems*/ 1 && t0_value !== (t0_value = (/*item*/ ctx[3].date || '') + "")) set_data_dev(t0, t0_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1$1.name,
			type: "slot",
			source: "(25:16) <TimelineOppositeContent slot=\\\"opposite-content\\\">",
			ctx
		});

		return block;
	}

	// (25:16) 
	function create_opposite_content_slot(ctx) {
		let timelineoppositecontent;
		let current;

		timelineoppositecontent = new TimelineOppositeContent({
				props: {
					slot: "opposite-content",
					$$slots: { default: [create_default_slot_1$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(timelineoppositecontent.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(timelineoppositecontent, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const timelineoppositecontent_changes = {};

				if (dirty & /*$$scope, timeLineItems*/ 4097) {
					timelineoppositecontent_changes.$$scope = { dirty, ctx };
				}

				timelineoppositecontent.$set(timelineoppositecontent_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(timelineoppositecontent.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(timelineoppositecontent.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(timelineoppositecontent, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_opposite_content_slot.name,
			type: "slot",
			source: "(25:16) ",
			ctx
		});

		return block;
	}

	// (23:8) {#each timeLineItems as item}
	function create_each_block$4(ctx) {
		let timelineitem;
		let current;

		timelineitem = new TimelineItem({
				props: {
					$$slots: {
						"opposite-content": [create_opposite_content_slot],
						default: [create_default_slot_2]
					},
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(timelineitem.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(timelineitem, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const timelineitem_changes = {};

				if (dirty & /*$$scope, timeLineItems*/ 4097) {
					timelineitem_changes.$$scope = { dirty, ctx };
				}

				timelineitem.$set(timelineitem_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(timelineitem.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(timelineitem.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(timelineitem, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$4.name,
			type: "each",
			source: "(23:8) {#each timeLineItems as item}",
			ctx
		});

		return block;
	}

	// (22:4) <Timeline position="{innerWidth < 640 ? 'right' : 'alternate'}">
	function create_default_slot$6(ctx) {
		let each_1_anchor;
		let current;
		let each_value = ensure_array_like_dev(/*timeLineItems*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},
			m: function mount(target, anchor) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert_dev(target, each_1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*timeLineItems*/ 1) {
					each_value = ensure_array_like_dev(/*timeLineItems*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$4(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$4(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$6.name,
			type: "slot",
			source: "(22:4) <Timeline position=\\\"{innerWidth < 640 ? 'right' : 'alternate'}\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$c(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		let mounted;
		let dispose;
		add_render_callback(/*onwindowresize*/ ctx[2]);
		const if_block_creators = [create_if_block$4, create_else_block$3];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*innerWidth*/ ctx[1] === 0) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;

				if (!mounted) {
					dispose = listen_dev(window, "resize", /*onwindowresize*/ ctx[2]);
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$c.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$c($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('StyledTimeLine', slots, []);
		let { timeLineItems } = $$props;
		let innerWidth = 0;

		$$self.$$.on_mount.push(function () {
			if (timeLineItems === undefined && !('timeLineItems' in $$props || $$self.$$.bound[$$self.$$.props['timeLineItems']])) {
				console.warn("<StyledTimeLine> was created without expected prop 'timeLineItems'");
			}
		});

		const writable_props = ['timeLineItems'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StyledTimeLine> was created with unknown prop '${key}'`);
		});

		function onwindowresize() {
			$$invalidate(1, innerWidth = window.innerWidth);
		}

		$$self.$$set = $$props => {
			if ('timeLineItems' in $$props) $$invalidate(0, timeLineItems = $$props.timeLineItems);
		};

		$$self.$capture_state = () => ({
			Timeline,
			TimelineItem,
			TimelineSeparator,
			TimelineDot,
			TimelineConnector,
			TimelineContent,
			TimelineOppositeContent,
			timeLineItems,
			innerWidth
		});

		$$self.$inject_state = $$props => {
			if ('timeLineItems' in $$props) $$invalidate(0, timeLineItems = $$props.timeLineItems);
			if ('innerWidth' in $$props) $$invalidate(1, innerWidth = $$props.innerWidth);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [timeLineItems, innerWidth, onwindowresize];
	}

	class StyledTimeLine extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$c, create_fragment$c, safe_not_equal, { timeLineItems: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "StyledTimeLine",
				options,
				id: create_fragment$c.name
			});
		}

		get timeLineItems() {
			throw new Error("<StyledTimeLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set timeLineItems(value) {
			throw new Error("<StyledTimeLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/**
	 *
	 * @param {string} name - image filename
	 * @param {string} ext - file extension, (png, jpg, etc)
	 * @param {number} size - image quality size (400, 800, 1200) see also rollup
	 * @returns {string}
	 */
	function getImage(name, ext, size){
	    const extension = ext ? ext : 'png';
	    const imageSize = size ? size : 400;
	    return `/g/assets/${name}-${imageSize}.${extension}`;
	}

	const app4mationLogo = getImage('app4mation');
	const plat4mationLogo = getImage('plat4mation');

	const workData = [
	    {
	        title: 'ServiceNow',
	        subtitle: 'Engineering Manager (M3)',
		level: 'm3',
	        description: 'I switched to a hybrid role with 50% development and 50% management, with my official title changing to manager. Continuing my work on mobile platform releases and coordinating with product / design and business units. While helping 4 direct reports grow in their career.',
	        bullets: [],
	        date: '2025 Jun',
	        image: getImage('servicenow_logo'),
	    },
	    {
	        title: 'ServiceNow',
	        subtitle: 'Staff Software Engineer (IC4)',
		level: 'ic4',
	        description: '4Industry got acquired by ServiceNow, we are going to re-platform the 4Industry suite on to the ServiceNow platform as the Connected Worker product. Worked on multiple mobile platform releases.',
	        bullets: ['Yokohama', 'Zurich'],
	        date: '2024 Apr',
	        image: getImage('servicenow_logo'),
	    },
	    {
	        title: '4Industry',
	        subtitle: 'Software Architect',
	        description: 'A role change to focus more on architecture rather than spending most of my time development. Doing this with a focus on our mobile platforms.',
	        bullets: [],
	        date: '2023 Oct',
	        image: app4mationLogo
	    },
	    {
	        title: '4Industry',
	        subtitle: 'Senior Developer',
	        description: 'The Company was renamed to better align with our product. Working on the iOS app, doing architecture work, code reviews and interviews of applicants for various roles.',
	        bullets: [],
	        date: '2022 Oct',
	        image: app4mationLogo
	    },
	    {
	        title: 'App4mation',
	        subtitle: 'Senior Developer',
	        description: 'iOS development for the 4Industry mobile application.',
	        bullets: ["4Industry"],
	        date: '2022 Oct',
	        image: app4mationLogo
	    },
	    {
	        title: 'ServiceNow',
	        subtitle: 'Contractor',
	        description: 'Worked on re-platforming the 4Facility suite on to the ServiceNow platform suite now known as Workplace Service Delivery, with a focus on the core reservation system and the outlook integration.',
	        date: '2021 Dec',
	        image: getImage('servicenow_logo')
	    },
	    {
	        title: 'App4mation',
	        subtitle: 'Senior Developer',
	        bullets: ['Workplace Service Delivery (contract)', '4Facility', '4Industry'],
	        date: '2020 May',
	        image: app4mationLogo
	    },
	    {
	        title: 'App4mation',
	        subtitle: 'Medior Developer',
	        bullets: ["4Industry", 'Boards4U'],
	        date: '2018 Jul',
	        image: app4mationLogo
	    },
	    {
	        title: 'Plat4mation',
	        subtitle: 'Medior Developer',
	        bullets: ["Heineken One2Improve", 'Boards4U', 'Agile4U'],
	        date: '2018 Jul',
	        image: plat4mationLogo
	    },
	    {
	        title: 'Plat4mation',
	        subtitle: 'Junior Developer',
	        description: 'Started my carreer working part-time while studying, as a fullstack developer using the ServiceNow platform.',
	        bullets: ['Scrumboard4U', 'Rooms4U', 'Planboard4U'],
	        date: '2016 Jul',
	        image: plat4mationLogo
	    },
	    {
	        title: 'Start',
	        description: 'While working at Plat4mation/App4mation with it being a startup and having limited resources I had a lot of opportunity to do architectural design work for the applications I worked on rather than just implementing already thought out features.',
	        date: '2016 jul'
	    }
	];

	const internshipData = [
	    {
	        title: 'App4mation',
	        subtitle: 'Master thesis project',
	        description: 'Story level risk assessment in agile\n' +
	            'software development using\n' +
	            'machine-learning',
	        date: '2022 May',
	        image: app4mationLogo,
	        attachments: [{
	            title: 'Master Thesis.pdf',
	            image: '/assets/file.svg',
	            url: '/assets/Thesis_Risk_assessment_in_agile_software_development.pdf'
	        }]
	    },
	    {
	        title: 'Plat4mation',
	        subtitle: 'Bachelor graduation project',
	        description: 'Build a set of tools to make local development on a ServiceNow instance easier. Researching which tools (Gulp, Grunt, etc) where the most fitting for Plat4mation\'s workflow.',
	        date: '2018 Feb',
	        image: plat4mationLogo,
	        attachments: [{
	            title: 'Bachelor Thesis.pdf',
	            image: '/assets/file.svg',
	            url: '/assets/Third_party_tool_integration_in_a_service_based_cloud_ecosystem.pdf'
	        }]
	    },
	    {
	        title: 'Microsoft',
	        subtitle: 'Eduneric gamemaker',
	        description: 'With a team of international students I worked on a C# UWP application, which generated browser based physicis games to explain physics concepts.',
	        date: '2015 Sep',
	        image: getImage('ms_logo')
	    },
	    {
	        title: 'Hostnet Bv',
	        subtitle: 'PHP Configuration validator',
	        description: 'A system which validated dependency injection configuration files, in the form of a PHP cli interface. ',
	        date: '2015 Jan'
	    },
	];

	/* src/routes/Experience.svelte generated by Svelte v4.2.20 */
	const file$b = "src/routes/Experience.svelte";

	// (15:4) <Card class="pb-6 flex-col">
	function create_default_slot_1(ctx) {
		let h1;
		let t1;
		let styledtimeline;
		let current;

		styledtimeline = new StyledTimeLine({
				props: { timeLineItems: /*work*/ ctx[0] },
				$$inline: true
			});

		const block = {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Experience";
				t1 = space();
				create_component(styledtimeline.$$.fragment);
				attr_dev(h1, "class", "text-center my-4 font-bold text-lg");
				add_location(h1, file$b, 15, 8, 448);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				insert_dev(target, t1, anchor);
				mount_component(styledtimeline, target, anchor);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(styledtimeline.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(styledtimeline.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
					detach_dev(t1);
				}

				destroy_component(styledtimeline, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1.name,
			type: "slot",
			source: "(15:4) <Card class=\\\"pb-6 flex-col\\\">",
			ctx
		});

		return block;
	}

	// (20:4) <Card class="pb-6 flex-col mt-6">
	function create_default_slot$5(ctx) {
		let h1;
		let t1;
		let styledtimeline;
		let current;

		styledtimeline = new StyledTimeLine({
				props: { timeLineItems: /*internships*/ ctx[1] },
				$$inline: true
			});

		const block = {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Internships";
				t1 = space();
				create_component(styledtimeline.$$.fragment);
				attr_dev(h1, "class", "text-center my-4");
				add_location(h1, file$b, 20, 8, 635);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				insert_dev(target, t1, anchor);
				mount_component(styledtimeline, target, anchor);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(styledtimeline.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(styledtimeline.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
					detach_dev(t1);
				}

				destroy_component(styledtimeline, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$5.name,
			type: "slot",
			source: "(20:4) <Card class=\\\"pb-6 flex-col mt-6\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$b(ctx) {
		let div;
		let card0;
		let t0;
		let card1;
		let t1;
		let meta0;
		let meta1;
		let meta2;
		let current;

		card0 = new Card({
				props: {
					class: "pb-6 flex-col",
					$$slots: { default: [create_default_slot_1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		card1 = new Card({
				props: {
					class: "pb-6 flex-col mt-6",
					$$slots: { default: [create_default_slot$5] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");
				create_component(card0.$$.fragment);
				t0 = space();
				create_component(card1.$$.fragment);
				t1 = space();
				meta0 = element("meta");
				meta1 = element("meta");
				meta2 = element("meta");
				add_location(div, file$b, 13, 0, 401);
				document.title = "Meerman";
				attr_dev(meta0, "name", "description");
				attr_dev(meta0, "content", "A list of work experiences");
				add_location(meta0, file$b, 27, 4, 818);
				attr_dev(meta1, "name", "author");
				attr_dev(meta1, "content", "Dries Meerman");
				add_location(meta1, file$b, 28, 4, 885);
				attr_dev(meta2, "name", "keywords");
				attr_dev(meta2, "content", "Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, " + /*uniqueTitles*/ ctx[2].join(', '));
				add_location(meta2, file$b, 29, 4, 934);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(card0, div, null);
				append_dev(div, t0);
				mount_component(card1, div, null);
				insert_dev(target, t1, anchor);
				append_dev(document.head, meta0);
				append_dev(document.head, meta1);
				append_dev(document.head, meta2);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const card0_changes = {};

				if (dirty & /*$$scope*/ 8) {
					card0_changes.$$scope = { dirty, ctx };
				}

				card0.$set(card0_changes);
				const card1_changes = {};

				if (dirty & /*$$scope*/ 8) {
					card1_changes.$$scope = { dirty, ctx };
				}

				card1.$set(card1_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(card0.$$.fragment, local);
				transition_in(card1.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(card0.$$.fragment, local);
				transition_out(card1.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
					detach_dev(t1);
				}

				destroy_component(card0);
				destroy_component(card1);
				detach_dev(meta0);
				detach_dev(meta1);
				detach_dev(meta2);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$b.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$b($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Experience', slots, []);
		const work = workData;
		const internships = internshipData;

		let uniqueTitles = [
			...new Set([...work.map(item => item.title), ...internships.map(item => item.title)])
		];

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Experience> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			StyledTimeLine,
			Card,
			workData,
			internshipData,
			work,
			internships,
			uniqueTitles
		});

		$$self.$inject_state = $$props => {
			if ('uniqueTitles' in $$props) $$invalidate(2, uniqueTitles = $$props.uniqueTitles);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [work, internships, uniqueTitles];
	}

	class Experience extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Experience",
				options,
				id: create_fragment$b.name
			});
		}
	}

	/* src/components/Skills/PillButton.svelte generated by Svelte v4.2.20 */
	const file$a = "src/components/Skills/PillButton.svelte";

	function create_fragment$a(ctx) {
		let button;
		let div0;
		let svg;
		let g;
		let path;
		let div0_class_value;
		let t0;
		let div1;
		let t1;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				button = element("button");
				div0 = element("div");
				svg = svg_element("svg");
				g = svg_element("g");
				path = svg_element("path");
				t0 = space();
				div1 = element("div");
				t1 = text(/*name*/ ctx[1]);
				attr_dev(path, "d", "M78.049,19.015L29.458,67.606c-0.428,0.428-1.121,0.428-1.548,0L0.32,40.015c-0.427-0.426-0.427-1.119,0-1.547l6.704-6.704\n    c0.428-0.427,1.121-0.427,1.548,0l20.113,20.112l41.113-41.113c0.429-0.427,1.12-0.427,1.548,0l6.703,6.704\n    C78.477,17.894,78.477,18.586,78.049,19.015z");
				add_location(path, file$a, 16, 4, 693);
				add_location(g, file$a, 15, 4, 685);
				attr_dev(svg, "class", "w-4 h-4");
				attr_dev(svg, "version", "1.1");
				attr_dev(svg, "id", "Capa_1");
				attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
				attr_dev(svg, "width", "800px");
				attr_dev(svg, "height", "800px");
				attr_dev(svg, "viewBox", "0 0 78.369 78.369");
				attr_dev(svg, "xml:space", "preserve");
				add_location(svg, file$a, 12, 4, 469);
				attr_dev(div0, "class", div0_class_value = "" + ((/*selected*/ ctx[0] ? 'w-4' : 'opacity-0 w-0') + " h-6 transition-all duration-300 ease dark:fill-white flex flex-col justify-center"));
				add_location(div0, file$a, 11, 0, 331);
				attr_dev(div1, "class", "ml-2 select-none");
				add_location(div1, file$a, 23, 0, 1008);
				attr_dev(button, "class", "py-2 px-4 flex rounded-full bg-stone-300 hover:bg-stone-400 dark:bg-zinc-500 bg-opacity-80 dark:bg-opacity-70 hover:dark:bg-zinc-600 hover:outline outline-1");
				add_location(button, file$a, 7, 0, 126);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);
				append_dev(button, div0);
				append_dev(div0, svg);
				append_dev(svg, g);
				append_dev(g, path);
				append_dev(button, t0);
				append_dev(button, div1);
				append_dev(div1, t1);

				if (!mounted) {
					dispose = [
						listen_dev(button, "click", /*select*/ ctx[2], false, false, false, false),
						listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*selected*/ 1 && div0_class_value !== (div0_class_value = "" + ((/*selected*/ ctx[0] ? 'w-4' : 'opacity-0 w-0') + " h-6 transition-all duration-300 ease dark:fill-white flex flex-col justify-center"))) {
					attr_dev(div0, "class", div0_class_value);
				}

				if (dirty & /*name*/ 2) set_data_dev(t1, /*name*/ ctx[1]);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$a.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$a($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('PillButton', slots, []);
		let { selected = false } = $$props;
		let { name } = $$props;

		const select = () => {
			$$invalidate(0, selected = !selected);
		};

		$$self.$$.on_mount.push(function () {
			if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
				console.warn("<PillButton> was created without expected prop 'name'");
			}
		});

		const writable_props = ['selected', 'name'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PillButton> was created with unknown prop '${key}'`);
		});

		function click_handler(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
			if ('name' in $$props) $$invalidate(1, name = $$props.name);
		};

		$$self.$capture_state = () => ({ selected, name, select });

		$$self.$inject_state = $$props => {
			if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
			if ('name' in $$props) $$invalidate(1, name = $$props.name);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [selected, name, select, click_handler];
	}

	class PillButton extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$a, create_fragment$a, safe_not_equal, { selected: 0, name: 1 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "PillButton",
				options,
				id: create_fragment$a.name
			});
		}

		get selected() {
			throw new Error("<PillButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set selected(value) {
			throw new Error("<PillButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get name() {
			throw new Error("<PillButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set name(value) {
			throw new Error("<PillButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/TradingCard.svelte generated by Svelte v4.2.20 */
	const file$9 = "src/components/TradingCard.svelte";

	function create_fragment$9(ctx) {
		let div5;
		let div0;
		let div0_class_value;
		let t0;
		let div3;
		let div1;
		let img;
		let img_src_value;
		let t1;
		let div2;
		let t2;
		let div4;
		let t3;
		let div5_class_value;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[10].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

		const block = {
			c: function create() {
				div5 = element("div");
				div0 = element("div");
				t0 = space();
				div3 = element("div");
				div1 = element("div");
				img = element("img");
				t1 = space();
				div2 = element("div");
				if (default_slot) default_slot.c();
				t2 = space();
				div4 = element("div");
				t3 = text(/*backText*/ ctx[2]);

				attr_dev(div0, "class", div0_class_value = "" + ((/*hasShine*/ ctx[7] && /*hideOverflow*/ ctx[5]
				? 'shine'
				: '') + " overflow-visible" + " svelte-1hz7brq"));

				add_location(div0, file$9, 73, 4, 2297);
				attr_dev(img, "alt", /*alt*/ ctx[1]);
				attr_dev(img, "class", "image object-contain h-full w-full aspect-square");
				if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[0])) attr_dev(img, "src", img_src_value);
				add_location(img, file$9, 79, 12, 2578);
				attr_dev(div1, "class", "card-image w-32 h-20 md:w-36 md:h-28 border-solid border-2 border-white/10 mx-3 mt-2 self-center p-4 rounded-lg svelte-1hz7brq");
				add_location(div1, file$9, 76, 8, 2419);
				attr_dev(div2, "class", "p-3 h-full");
				add_location(div2, file$9, 85, 8, 2744);
				attr_dev(div3, "class", "front h-full w-full svelte-1hz7brq");
				add_location(div3, file$9, 75, 4, 2377);
				attr_dev(div4, "class", "back card-body-text h-full w-full flex flex-col p-4 mt-auto svelte-1hz7brq");
				add_location(div4, file$9, 90, 4, 2821);
				attr_dev(div5, "class", div5_class_value = "skill-card flex flex-col h-48 w-30 md:h-64 md:w-40 border-solid border-teal rounded-lg bg-gradient-to-r " + (/*showBackSide*/ ctx[4] ? 'show-back-side' : '') + " " + (/*hideOverflow*/ ctx[5] ? 'overflow-hidden' : '') + " " + /*colorRarity*/ ctx[6][/*rarity*/ ctx[3]] + " svelte-1hz7brq");
				attr_dev(div5, "role", "button");
				attr_dev(div5, "tabindex", "0");
				add_location(div5, file$9, 64, 0, 1937);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div5, anchor);
				append_dev(div5, div0);
				append_dev(div5, t0);
				append_dev(div5, div3);
				append_dev(div3, div1);
				append_dev(div1, img);
				append_dev(div3, t1);
				append_dev(div3, div2);

				if (default_slot) {
					default_slot.m(div2, null);
				}

				append_dev(div5, t2);
				append_dev(div5, div4);
				append_dev(div4, t3);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(div5, "click", /*click_handler*/ ctx[11], false, false, false, false),
						listen_dev(div5, "keydown", /*cardClicked*/ ctx[8], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (!current || dirty & /*hideOverflow*/ 32 && div0_class_value !== (div0_class_value = "" + ((/*hasShine*/ ctx[7] && /*hideOverflow*/ ctx[5]
				? 'shine'
				: '') + " overflow-visible" + " svelte-1hz7brq"))) {
					attr_dev(div0, "class", div0_class_value);
				}

				if (!current || dirty & /*alt*/ 2) {
					attr_dev(img, "alt", /*alt*/ ctx[1]);
				}

				if (!current || dirty & /*image*/ 1 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[0])) {
					attr_dev(img, "src", img_src_value);
				}

				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[9],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*backText*/ 4) set_data_dev(t3, /*backText*/ ctx[2]);

				if (!current || dirty & /*showBackSide, hideOverflow, rarity*/ 56 && div5_class_value !== (div5_class_value = "skill-card flex flex-col h-48 w-30 md:h-64 md:w-40 border-solid border-teal rounded-lg bg-gradient-to-r " + (/*showBackSide*/ ctx[4] ? 'show-back-side' : '') + " " + (/*hideOverflow*/ ctx[5] ? 'overflow-hidden' : '') + " " + /*colorRarity*/ ctx[6][/*rarity*/ ctx[3]] + " svelte-1hz7brq")) {
					attr_dev(div5, "class", div5_class_value);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div5);
				}

				if (default_slot) default_slot.d(detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$9.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$9($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TradingCard', slots, ['default']);
		let { image } = $$props;
		let { alt = "an image" } = $$props;
		let { backText = "" } = $$props;
		let { rarity = "common" } = $$props;
		let showBackSide = false;
		let hideOverflow = true;

		const colorPairs = [
			["from-purple-500/25", "to-pink-500/25"],
			["from-green-500/25", "to-blue-500/25"],
			["from-yellow-500/25", "to-red-500/25"],
			["from-pink-500/25", "to-purple-500/25"],
			["from-blue-500/25", "to-green-500/25"],
			["from-red-500/25", "to-yellow-500/25"],
			["from-pink-500/25", "to-yellow-500/25"],
			["from-blue-500/25", "to-purple-500/25"],
			["from-red-500/25", "to-green-500/25"],
			["from-purple-500/25", "to-blue-500/25"],
			["from-green-500/25", "to-yellow-500/25"],
			["from-yellow-500/25", "to-pink-500/25"],
			["from-gray-500/25", "to-pink-300/25"],
			["from-pink-400/25", "to-purple-600/25"]
		];

		const colors = {
			purple: "from-purple-500/25 to-pink-500/25",
			green: "from-green-500/25 to-blue-500/25",
			yellow: "from-yellow-500/25 to-red-500/25",
			pink: "from-pink-500/25 to-purple-500/25",
			blue: "from-cyan-500/25 to-blue-500/25",
			red: "from-amber-500/25 to-red-500/25",
			gray: "from-gray-500/25 to-pink-300/25"
		};

		const colorRarity = {
			common: colors.gray,
			uncommon: colors.green,
			rare: colors.blue,
			epic: colors.purple,
			legendary: colors.red
		};

		const hasShine = rarity === "epic" || rarity === "legendary";

		function cardClicked(event) {
			if (event.key === "Enter" || event.key === " ") {
				$$invalidate(4, showBackSide = !showBackSide);
				event.preventDefault();
			}
		}

		$$self.$$.on_mount.push(function () {
			if (image === undefined && !('image' in $$props || $$self.$$.bound[$$self.$$.props['image']])) {
				console.warn("<TradingCard> was created without expected prop 'image'");
			}
		});

		const writable_props = ['image', 'alt', 'backText', 'rarity'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TradingCard> was created with unknown prop '${key}'`);
		});

		const click_handler = () => $$invalidate(4, showBackSide = !showBackSide);

		$$self.$$set = $$props => {
			if ('image' in $$props) $$invalidate(0, image = $$props.image);
			if ('alt' in $$props) $$invalidate(1, alt = $$props.alt);
			if ('backText' in $$props) $$invalidate(2, backText = $$props.backText);
			if ('rarity' in $$props) $$invalidate(3, rarity = $$props.rarity);
			if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			image,
			alt,
			backText,
			rarity,
			showBackSide,
			hideOverflow,
			colorPairs,
			colors,
			colorRarity,
			hasShine,
			cardClicked
		});

		$$self.$inject_state = $$props => {
			if ('image' in $$props) $$invalidate(0, image = $$props.image);
			if ('alt' in $$props) $$invalidate(1, alt = $$props.alt);
			if ('backText' in $$props) $$invalidate(2, backText = $$props.backText);
			if ('rarity' in $$props) $$invalidate(3, rarity = $$props.rarity);
			if ('showBackSide' in $$props) $$invalidate(4, showBackSide = $$props.showBackSide);
			if ('hideOverflow' in $$props) $$invalidate(5, hideOverflow = $$props.hideOverflow);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*showBackSide*/ 16) {
				{
					if (showBackSide) {
						$$invalidate(5, hideOverflow = false);
					} else {
						setTimeout(
							() => {
								$$invalidate(5, hideOverflow = true);
							},
							600
						);
					}
				}
			}
		};

		return [
			image,
			alt,
			backText,
			rarity,
			showBackSide,
			hideOverflow,
			colorRarity,
			hasShine,
			cardClicked,
			$$scope,
			slots,
			click_handler
		];
	}

	class TradingCard extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$9, create_fragment$9, safe_not_equal, { image: 0, alt: 1, backText: 2, rarity: 3 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TradingCard",
				options,
				id: create_fragment$9.name
			});
		}

		get image() {
			throw new Error("<TradingCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set image(value) {
			throw new Error("<TradingCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get alt() {
			throw new Error("<TradingCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set alt(value) {
			throw new Error("<TradingCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get backText() {
			throw new Error("<TradingCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set backText(value) {
			throw new Error("<TradingCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get rarity() {
			throw new Error("<TradingCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set rarity(value) {
			throw new Error("<TradingCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Skills/SkillCard.svelte generated by Svelte v4.2.20 */
	const file$8 = "src/components/Skills/SkillCard.svelte";

	function get_each_context$3(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[1] = list[i];
		return child_ctx;
	}

	// (20:16) {#each skill.attributes as attribute}
	function create_each_block$3(ctx) {
		let div;
		let t_value = /*attribute*/ ctx[1] + "";
		let t;
		let div_title_value;

		const block = {
			c: function create() {
				div = element("div");
				t = text(t_value);
				attr_dev(div, "class", "skill-attribute py-1 px-2 mr-2 mt-1 svelte-1dsvkt");
				attr_dev(div, "title", div_title_value = /*attribute*/ ctx[1]);
				add_location(div, file$8, 20, 20, 570);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*skill*/ 1 && t_value !== (t_value = /*attribute*/ ctx[1] + "")) set_data_dev(t, t_value);

				if (dirty & /*skill*/ 1 && div_title_value !== (div_title_value = /*attribute*/ ctx[1])) {
					attr_dev(div, "title", div_title_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$3.name,
			type: "each",
			source: "(20:16) {#each skill.attributes as attribute}",
			ctx
		});

		return block;
	}

	// (9:4) <TradingCard         image={skill.image}         alt={skill.altText}         rarity={skill.rarity}     >
	function create_default_slot$4(ctx) {
		let div2;
		let div0;
		let h2;
		let t0_value = /*skill*/ ctx[0].name + "";
		let t0;
		let t1;
		let hr;
		let t2;
		let div1;
		let each_value = ensure_array_like_dev(/*skill*/ ctx[0].attributes);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				div2 = element("div");
				div0 = element("div");
				h2 = element("h2");
				t0 = text(t0_value);
				t1 = space();
				hr = element("hr");
				t2 = space();
				div1 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(h2, "class", "skill-title svelte-1dsvkt");
				add_location(h2, file$8, 15, 16, 305);
				attr_dev(hr, "class", "max-w-[90%] dark:border-zinc-50 border-zinc-800");
				add_location(hr, file$8, 16, 16, 363);
				add_location(div0, file$8, 14, 12, 283);
				attr_dev(div1, "class", "rounded-sm flex flex-row");
				add_location(div1, file$8, 18, 12, 457);
				attr_dev(div2, "class", "flex flex-col justify-between h-full");
				add_location(div2, file$8, 13, 8, 220);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, div0);
				append_dev(div0, h2);
				append_dev(h2, t0);
				append_dev(div0, t1);
				append_dev(div0, hr);
				append_dev(div2, t2);
				append_dev(div2, div1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div1, null);
					}
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*skill*/ 1 && t0_value !== (t0_value = /*skill*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

				if (dirty & /*skill*/ 1) {
					each_value = ensure_array_like_dev(/*skill*/ ctx[0].attributes);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$3(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$3(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div2);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$4.name,
			type: "slot",
			source: "(9:4) <TradingCard         image={skill.image}         alt={skill.altText}         rarity={skill.rarity}     >",
			ctx
		});

		return block;
	}

	function create_fragment$8(ctx) {
		let div;
		let tradingcard;
		let current;

		tradingcard = new TradingCard({
				props: {
					image: /*skill*/ ctx[0].image,
					alt: /*skill*/ ctx[0].altText,
					rarity: /*skill*/ ctx[0].rarity,
					$$slots: { default: [create_default_slot$4] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");
				create_component(tradingcard.$$.fragment);
				add_location(div, file$8, 7, 0, 97);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(tradingcard, div, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const tradingcard_changes = {};
				if (dirty & /*skill*/ 1) tradingcard_changes.image = /*skill*/ ctx[0].image;
				if (dirty & /*skill*/ 1) tradingcard_changes.alt = /*skill*/ ctx[0].altText;
				if (dirty & /*skill*/ 1) tradingcard_changes.rarity = /*skill*/ ctx[0].rarity;

				if (dirty & /*$$scope, skill*/ 17) {
					tradingcard_changes.$$scope = { dirty, ctx };
				}

				tradingcard.$set(tradingcard_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(tradingcard.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(tradingcard.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_component(tradingcard);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$8.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$8($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('SkillCard', slots, []);
		let { skill } = $$props;

		$$self.$$.on_mount.push(function () {
			if (skill === undefined && !('skill' in $$props || $$self.$$.bound[$$self.$$.props['skill']])) {
				console.warn("<SkillCard> was created without expected prop 'skill'");
			}
		});

		const writable_props = ['skill'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SkillCard> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('skill' in $$props) $$invalidate(0, skill = $$props.skill);
		};

		$$self.$capture_state = () => ({ TradingCard, skill });

		$$self.$inject_state = $$props => {
			if ('skill' in $$props) $$invalidate(0, skill = $$props.skill);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [skill];
	}

	class SkillCard extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$8, create_fragment$8, safe_not_equal, { skill: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "SkillCard",
				options,
				id: create_fragment$8.name
			});
		}

		get skill() {
			throw new Error("<SkillCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set skill(value) {
			throw new Error("<SkillCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* This is a mainly json data but structured in JS files to allow for comments and using the image service to get resized images.
	 * Still using json structure for easier portability in the future.
	*/

	const skills$1 = {
	    "language": [
	        {
	            "name": "Swift",
	            "description": "Swift is a general-purpose, multi-paradigm, compiled programming language developed by Apple Inc. Mainly used for iOS development.",
	            "image": "https://cdn-icons-png.flaticon.com/512/732/732250.png",
	            "logoAlt": "Swift logo",
	            "attributes": ["mobile"],
	            "rarity": "legendary"
	        },
	        {
	            "name": "HTML5",
	            "description": "HTML5 is the latest version of Hypertext Markup Language, the code that describes web pages.",
	            "image": "https://cdn.pixabay.com/photo/2017/08/05/11/16/logo-2582748_960_720.png",
	            "logoAlt": "HTML5 logo",
	            "attributes": ["frontend"],
	            "rarity": "uncommon"
	        },
	        {
	            "name": "JavaScript",
	            "description": "JavaScript (JS) can be used to dynamically change the content and structure of a web page. Allowing web pages to become interactive.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/2048px-Unofficial_JavaScript_logo_2.svg.png",
	            "logoAlt": "JavaScript logo",
	            "attributes": [
	                "frontend",
	                "backend"
	            ],
	            "rarity": "legendary"
	        },
	        {
	            "name": "CSS3",
	            "description": "CSS3 is the latest version of Cascading Style Sheets, a style sheet language used for describing the presentation of a document written in HTML.",
	            "image": "https://cdn.pixabay.com/photo/2017/08/05/11/16/logo-2582747_960_720.png",
	            "logoAlt": "CSS3 logo",
	            "attributes": ["frontend"],
	            "rarity": "uncommon"
	        },
	        {
	            "name": "Python",
	            "description": "Python is a interpreted, high-level, general-purpose programming language.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/2048px-Python-logo-notext.svg.png",
	            "logoAlt": "Python logo",
	            "attributes": ["backend"],
	            "rarity": "rare"
	        },
	        {
	            "name": "SQL",
	            "description": "Structured Query Language (SQL) is a language used to communicate with databases in a declerative way.",
	            "image": "https://cdn-icons-png.flaticon.com/512/2383/2383158.png",
	            "logoAlt": "SQL logo",
	            "attributes": [
	                "database",
	            ],
	            "rarity": "uncommon"
	        }, 
	        {
	            "name": "Dart",
	            "description": "Dart is a client-optimized programming language. It is developed by Google and is used to build mobile, desktop, server, and web applications.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Dart-logo.png/2048px-Dart-logo.png",
	            "logoAlt": "Dart logo",
	            "attributes": ["mobile"],
	            "rarity": "rare"
	        },
	        {
	            "name": "Java",
	            "description": "Java is a general-purpose, class-based, OOP language designed for portabillity.",
	            "image": "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/181_Java_logo_logos-512.png",
	            "logoAlt": "Java logo",
	            "attributes": ["backend", "mobile"],
	            "rarity": "uncommon"
	        },
	        {
	            "name": "Haskell",
	            "description": "Haskell is a general-purpose, statically typed, purely functional programming language with type inference and lazy evaluation.",
	            "image": "https://global-uploads.webflow.com/6047a9e35e5dc54ac86ddd90/63064c5652d40eda2eb7a838_33ac2334.png",
	            "logoAlt": "Haskell logo",
	            "attributes": ["backend"],
	            "rarity": "rare"
	        },
	        {
	            "name": "C",
	            "description": "C is a general-purpose, procedural computer programming language supporting structured programming, lexical variable scope, and recursion.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/C_Programming_Language.svg/1200px-C_Programming_Language.svg.png",
	            "logoAlt": "C logo",
	            "attributes": ["backend"],
	            "rarity": "uncommon"
	        }

	    ],
	    "framework": [

	        {
	            "name": "SwiftUI",
	            "description": "SwiftUI is an innovative, exceptionally simple way to build user interfaces across all Apple platforms with the power of Swift.",
	            "image": "https://developer.apple.com/assets/elements/icons/swiftui/swiftui-96x96.png",
	            "logoAlt": "SwiftUI logo",
	            "attributes": ["mobile"],
	            "rarity": "epic"
	        },

	        {
	            "name": "Realm",
	            "description": "MongoDB Realm is a serverless platform that allows you to build modern mobile apps faster, with less code, and more confidence.",
	            "image": getImage("logos/realm_db_logo", "png", 306),
	            "logoAlt": "MongoDB Realm logo",
	            "attributes": ["mobile", "database"],
	            "rarity": "rare"
	        },

	        {
	            "name": "Flutter",
	            "description": "Flutter is an open-source UI software development kit created by Google. It is used to develop cross platform applications.",
	            "image": "https://cdn.iconscout.com/icon/free/png-256/free-flutter-2038877-1720090.png",
	            "logoAlt": "Flutter logo",
	            "attributes": ["mobile"],
	            "rarity": "rare"
	        },
	        {
	            "name": "Node.js",
	            "description": "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JS on the server.",
	            "image": "https://cdn.iconscout.com/icon/free/png-256/free-node-js-1174925.png",
	            "logoAlt": "Node.js logo",
	            "attributes": ["backend"],
	            "rarity": "uncommon"
	        },
	        {
	            "name": "Spring",
	            "description": "Spring is a framework for building Java applications. It is used to build anything from standalone programs to microservices.",
	            "image": "https://cdn.freebiesupply.com/logos/large/2x/spring-3-logo-png-transparent.png",
	            "logoAlt": "Spring logo",
	            "attributes": ["backend"],
	            "rarity": "uncommon"
	            
	        },
	        {
	            "name": "Svelte",
	            "description": "Svelte is a JS framework that approaches frontend development by using compiler optimizations to deliver fast applications.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/2048px-Svelte_Logo.svg.png",
	            "logoAlt": "Svelte logo",
	            "attributes": ["frontend"],
	            "rarity": "rare"
	        },
	        {
	            "name": "Tailwind CSS",
	            "description": "Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2048px-Tailwind_CSS_Logo.svg.png",
	            "logoAlt": "Tailwind CSS logo",
	            "attributes": ["frontend"],
	            "rarity": "rare"
	        },
	        {
	            "name": "Vue.js",
	            "description": "Vue.js is a progressive framework for building user interfaces.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vue.js_Logo_2.svg/2048px-Vue.js_Logo_2.svg.png",
	            "logoAlt": "Vue.js logo",
	            "attributes": ["frontend"],
	            "rarity": "uncommon"
	        },

	        {
	            "name": "AngularJS",
	            "description": "AngularJS is a now deprecated JS framework for building web applications. Wich pioneered many of the approaches used in modern JS frameworks.",
	            "image": "https://angular.io/assets/images/logos/angular/angular.png",
	            "logoAlt": "AngularJS logo",
	            "attributes": ["frontend"],
	            "rarity": "common"
	        },
	    ],
	    "tooling": [
	        {
	            "name": "Git",
	            "description": "Git is a distributed version-control system for tracking changes in source code during software development.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Git_icon.svg/2048px-Git_icon.svg.png",
	            "logoAlt": "Git logo",
	            "attributes": ["devops"],
	            "rarity": "uncommon"
	        },
	        {
	            "name": "Bash",
	            "description": "Bash is a Unix shell and command language written by Brian Fox for the GNU Project as a free software replacement for the Bourne shell.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Gnu-bash-logo.svg/2048px-Gnu-bash-logo.svg.png",
	            "logoAlt": "Bash logo",
	            "attributes": ["scripting"],
	            "rarity": "uncommon"
	        },
	   
	        {
	            "name": "Docker",
	            "description": "Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers.",
	            "image": "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png",
	            "logoAlt": "Docker logo",
	            "attributes": ["cloud", "devops"],
	            "rarity": "epic"
	        },
	        {
	            "name": "GitHub",
	            "description": "GitHub is a provider of Internet hosting for software development and version control using Git.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/2048px-Octicons-mark-github.svg.png",
	            "logoAlt": "GitHub logo",
	            "attributes": ["devops"],
	            "rarity": "common"
	        },
	        {
	            "name": "GitLab",
	            "description": "GitLab is a web-based DevOps lifecycle tool that provides a Git-repository manager providing wiki, issue-tracking and CI/CD pipeline features.",
	            "image": "https://cdn-icons-png.flaticon.com/256/5968/5968853.png",
	            "logoAlt": "GitLab logo",
	            "attributes": ["devops"],
	            "rarity": "common"
	        },
	        {
	            "name": "ServiceNow",
	            "description": "ServiceNow is a cloud-based software platform that supports enterprise service management. It offers services (SaaS) and allows customization (PaaS).",
	            "image": getImage('servicenow_logo'),
	            "logoAlt": "ServiceNow logo",
	            "attributes": ["PaaS"],
	            "rarity": "epic"
	        },
	        {
	            "name": "MacOS",
	            "description": "macOS is a series of proprietary graphical operating systems developed and marketed by Apple Inc. since 2001.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/MacOS_wordmark_%282017%29.svg/2048px-MacOS_wordmark_%282017%29.svg.png",
	            "logoAlt": "MacOS logo",
	            "attributes": ["OS"],
	            "rarity": "common"
	        },
	        {
	            "name": "Linux",
	            "description": "Linux is a family of open-source Unix-like operating systems based on the Linux kernel, an operating system kernel first released on September 17, 1991, by Linus Torvalds.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tux.svg/2048px-Tux.svg.png",
	            "logoAlt": "Linux logo",
	            "attributes": ["OS"],
	            "rarity": "uncommon"
	        },
	        {
	            "name": "Windows",
	            "description": "Microsoft Windows, commonly referred to as Windows, is a group of several proprietary graphical operating system families, all of which are developed and marketed by Microsoft.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Windows_logo_-_2012.svg/2048px-Windows_logo_-_2012.svg.png",
	            "logoAlt": "Windows logo",
	            "attributes": ["OS"],
	            "rarity": "common"
	        },
	        {
	            "name": "AWS",
	            "description": "Amazon Web Services (AWS) is a subsidiary of Amazon providing on-demand cloud computing platforms and APIs to individuals, companies, and governments, on a metered pay-as-you-go basis.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/2048px-Amazon_Web_Services_Logo.svg.png",
	            "logoAlt": "AWS logo",
	            "attributes": ["cloud"],
	            "rarity": "rare"
	        },
	    ],

	    "misc": [
	        {
	            "name": "Scrum",
	            "description": "PSM I certification",
	            "image": "https://www.scrum.org/themes/custom/scrumorg_v2/assets/images/logo-250.png",
	            "logoAlt": "Scrum logo",
	            "attributes": ["agile", "PSM I"],
	            "rarity": "common"
	        },
	        {
	            "name": "Kanban",
	            "description": "Kanban is a scheduling system for lean manufacturing and just-in-time manufacturing.",
	            "image": "https://cdn-icons-png.flaticon.com/512/8746/8746714.png",
	            "logoAlt": "Kanban logo",
	            "attributes": ["agile"],
	            "rarity": "common"
	        },
	        {
	            "name": "UML",
	            "description": "Unified Modeling Language (UML), is a modeling language used in software engineering it provides a standard way to visualize the design of a system.",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Diagrams.net_Logo.svg/2048px-Diagrams.net_Logo.svg.png",
	            "logoAlt": "UML logo",
	            "attributes": ["architecture"],
	            "rarity": "uncommon"
	        },

	        {
	            "name": "Dutch",
	            "description": "Native language",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/2048px-Flag_of_the_Netherlands.svg.png",
	            "logoAlt": "Dutch flag",
	            "attributes": ["language"],
	            "rarity": "common"
	        },
	        {
	            "name": "English",
	            "description": "Fluent working proffeciency",
	            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Canada.svg/2560px-Flag_of_Canada.svg.png",
	            "logoAlt": "English flag",
	            "attributes": ["Language"],
	            "rarity": "common"
	        }
	    ]
	};

	class Skill {

	    /**
	     * @param {string} name
	     * @param {string} description
	     * @param {string} image
	     * @param {string} rarity
	     * @param {string}  [altText]
	     * @param {[string]} attributes
	     */
	    constructor(name, description, image, rarity, altText, attributes) {
	        this.name = name;
	        this.description = description;
	        this.image = image;
	        this.rarity = rarity;
	        this.altText = altText;
	        this.attributes = attributes;
	    }

	    static fromJSON(json) {
	        return new Skill(json.name, json.description, json.image, json.rarity, json.altText, json.attributes);
	    }
	    

	    /**
	     * a method that hashes the name of the skill to a number
	     */
	    getHash() {
	        let hash = 0;
	        for (let i = 0; i < this.name.length; i++) {
	            hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
	        }
	        return hash;
	    }
	}


	const skills= Object.keys(skills$1).reduce((result, current) => {
	    
	    result[current] = skills$1[current].map(skill => Skill.fromJSON(skill));
	    return result
	}, {});

	/* src/routes/SkillsPage.svelte generated by Svelte v4.2.20 */

	const { Object: Object_1 } = globals;
	const file$7 = "src/routes/SkillsPage.svelte";

	function get_each_context$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[5] = list[i];
		child_ctx[7] = i;
		return child_ctx;
	}

	function get_each_context_1$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[8] = list[i];
		return child_ctx;
	}

	function get_each_context_2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[5] = list[i];
		child_ctx[11] = list;
		child_ctx[12] = i;
		return child_ctx;
	}

	// (24:4) {#each Object.values(categories) as category}
	function create_each_block_2(ctx) {
		let div;
		let pillbutton;
		let t;
		let current;

		function click_handler() {
			return /*click_handler*/ ctx[3](/*category*/ ctx[5], /*each_value_2*/ ctx[11], /*category_index*/ ctx[12]);
		}

		pillbutton = new PillButton({
				props: {
					name: /*category*/ ctx[5].name,
					selected: /*category*/ ctx[5].selected
				},
				$$inline: true
			});

		pillbutton.$on("click", click_handler);

		const block = {
			c: function create() {
				div = element("div");
				create_component(pillbutton.$$.fragment);
				t = space();
				attr_dev(div, "class", "m-1");
				add_location(div, file$7, 24, 8, 1019);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(pillbutton, div, null);
				append_dev(div, t);
				current = true;
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				const pillbutton_changes = {};
				if (dirty & /*categories*/ 1) pillbutton_changes.name = /*category*/ ctx[5].name;
				if (dirty & /*categories*/ 1) pillbutton_changes.selected = /*category*/ ctx[5].selected;
				pillbutton.$set(pillbutton_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(pillbutton.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(pillbutton.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_component(pillbutton);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_2.name,
			type: "each",
			source: "(24:4) {#each Object.values(categories) as category}",
			ctx
		});

		return block;
	}

	// (45:16) {#each category.items || [] as skill}
	function create_each_block_1$1(ctx) {
		let div;
		let skillcard;
		let t;
		let current;

		skillcard = new SkillCard({
				props: { skill: /*skill*/ ctx[8] },
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");
				create_component(skillcard.$$.fragment);
				t = space();
				attr_dev(div, "class", "scale-90 md:scale-100");
				add_location(div, file$7, 45, 16, 1799);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(skillcard, div, null);
				append_dev(div, t);
				current = true;
			},
			p: function update(ctx, dirty) {
				const skillcard_changes = {};
				if (dirty & /*categories*/ 1) skillcard_changes.skill = /*skill*/ ctx[8];
				skillcard.$set(skillcard_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(skillcard.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(skillcard.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_component(skillcard);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1$1.name,
			type: "each",
			source: "(45:16) {#each category.items || [] as skill}",
			ctx
		});

		return block;
	}

	// (39:4) {#each Object.values(categories) as category, i}
	function create_each_block$2(ctx) {
		let div1;
		let h4;
		let t0_value = /*category*/ ctx[5].name + "";
		let t0;
		let t1;
		let hr;
		let t2;
		let div0;
		let t3;
		let div1_class_value;
		let current;
		let each_value_1 = ensure_array_like_dev(/*category*/ ctx[5].items || []);
		let each_blocks = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				div1 = element("div");
				h4 = element("h4");
				t0 = text(t0_value);
				t1 = space();
				hr = element("hr");
				t2 = space();
				div0 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t3 = space();
				attr_dev(h4, "class", "h4 ml-2");
				add_location(h4, file$7, 40, 12, 1567);
				add_location(hr, file$7, 41, 12, 1620);
				attr_dev(div0, "class", "flex flex-row justify-center flex-wrap md:p-4 md:mx-8 gap-4 md:gap-8 py-4");
				add_location(div0, file$7, 43, 12, 1640);
				attr_dev(div1, "class", div1_class_value = "p-1 " + (!/*category*/ ctx[5].selected ? 'hidden' : ''));
				add_location(div1, file$7, 39, 8, 1501);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, h4);
				append_dev(h4, t0);
				append_dev(div1, t1);
				append_dev(div1, hr);
				append_dev(div1, t2);
				append_dev(div1, div0);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div0, null);
					}
				}

				append_dev(div1, t3);
				current = true;
			},
			p: function update(ctx, dirty) {
				if ((!current || dirty & /*categories*/ 1) && t0_value !== (t0_value = /*category*/ ctx[5].name + "")) set_data_dev(t0, t0_value);

				if (dirty & /*Object, categories*/ 1) {
					each_value_1 = ensure_array_like_dev(/*category*/ ctx[5].items || []);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block_1$1(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(div0, null);
						}
					}

					group_outros();

					for (i = each_value_1.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}

				if (!current || dirty & /*categories*/ 1 && div1_class_value !== (div1_class_value = "p-1 " + (!/*category*/ ctx[5].selected ? 'hidden' : ''))) {
					attr_dev(div1, "class", div1_class_value);
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value_1.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$2.name,
			type: "each",
			source: "(39:4) {#each Object.values(categories) as category, i}",
			ctx
		});

		return block;
	}

	// (38:0) <Card class="px-2 py-3 mb-4 flex flex-col backdrop-blur-sm {selectedCount ? '' : 'hidden'} ">
	function create_default_slot$3(ctx) {
		let each_1_anchor;
		let current;
		let each_value = ensure_array_like_dev(Object.values(/*categories*/ ctx[0]));
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},
			m: function mount(target, anchor) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert_dev(target, each_1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*Object, categories*/ 1) {
					each_value = ensure_array_like_dev(Object.values(/*categories*/ ctx[0]));
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$2(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$3.name,
			type: "slot",
			source: "(38:0) <Card class=\\\"px-2 py-3 mb-4 flex flex-col backdrop-blur-sm {selectedCount ? '' : 'hidden'} \\\">",
			ctx
		});

		return block;
	}

	function create_fragment$7(ctx) {
		let div;
		let t0;
		let card;
		let t1;
		let meta0;
		let meta1;
		let meta2;
		let current;
		let each_value_2 = ensure_array_like_dev(Object.values(/*categories*/ ctx[0]));
		let each_blocks = [];

		for (let i = 0; i < each_value_2.length; i += 1) {
			each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		card = new Card({
				props: {
					class: "px-2 py-3 mb-4 flex flex-col backdrop-blur-sm " + (/*selectedCount*/ ctx[1] ? '' : 'hidden') + " ",
					$$slots: { default: [create_default_slot$3] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t0 = space();
				create_component(card.$$.fragment);
				t1 = space();
				meta0 = element("meta");
				meta1 = element("meta");
				meta2 = element("meta");
				attr_dev(div, "class", "category-selectors flex flex-row flex-wrap mb-4");
				add_location(div, file$7, 22, 0, 899);
				document.title = "Meerman";
				attr_dev(meta0, "name", "description");
				attr_dev(meta0, "content", "A list of hard and soft skills, visualized in a trading card format.");
				add_location(meta0, file$7, 63, 4, 2195);
				attr_dev(meta1, "name", "author");
				attr_dev(meta1, "content", "Dries Meerman");
				add_location(meta1, file$7, 64, 4, 2304);
				attr_dev(meta2, "name", "keywords");
				attr_dev(meta2, "content", "Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, " + /*keywords*/ ctx[2]);
				add_location(meta2, file$7, 65, 4, 2353);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}

				insert_dev(target, t0, anchor);
				mount_component(card, target, anchor);
				insert_dev(target, t1, anchor);
				append_dev(document.head, meta0);
				append_dev(document.head, meta1);
				append_dev(document.head, meta2);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*Object, categories, selectedCount*/ 3) {
					each_value_2 = ensure_array_like_dev(Object.values(/*categories*/ ctx[0]));
					let i;

					for (i = 0; i < each_value_2.length; i += 1) {
						const child_ctx = get_each_context_2(ctx, each_value_2, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block_2(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(div, null);
						}
					}

					group_outros();

					for (i = each_value_2.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}

				const card_changes = {};
				if (dirty & /*selectedCount*/ 2) card_changes.class = "px-2 py-3 mb-4 flex flex-col backdrop-blur-sm " + (/*selectedCount*/ ctx[1] ? '' : 'hidden') + " ";

				if (dirty & /*$$scope, categories*/ 8193) {
					card_changes.$$scope = { dirty, ctx };
				}

				card.$set(card_changes);
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value_2.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				transition_in(card.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				transition_out(card.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
					detach_dev(t0);
					detach_dev(t1);
				}

				destroy_each(each_blocks, detaching);
				destroy_component(card, detaching);
				detach_dev(meta0);
				detach_dev(meta1);
				detach_dev(meta2);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$7.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$7($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('SkillsPage', slots, []);

		const categories = {
			lang: {
				name: "Languages",
				selected: true,
				items: skills.language
			},
			framework: {
				name: "Frameworks",
				selected: true,
				items: skills.framework
			},
			tooling: {
				name: "Tools",
				selected: true,
				items: skills.tooling
			},
			misc: {
				name: "Miscellaneous",
				selected: true,
				items: skills.misc
			}
		};

		const categoryContent = Object.values(categories);
		let selectedCount = categoryContent.filter(c => c.selected).length;
		let keywords = categoryContent.flatMap(c => c.items).map(s => s.name).join(', ');
		const writable_props = [];

		Object_1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SkillsPage> was created with unknown prop '${key}'`);
		});

		const click_handler = (category, each_value_2, category_index) => {
			$$invalidate(0, each_value_2[category_index].selected = !category.selected, categories);
			let add = category.selected ? 1 : -1;
			$$invalidate(1, selectedCount += add);
		};

		$$self.$capture_state = () => ({
			Card,
			PillButton,
			SkillCard,
			skills,
			categories,
			categoryContent,
			selectedCount,
			keywords
		});

		$$self.$inject_state = $$props => {
			if ('selectedCount' in $$props) $$invalidate(1, selectedCount = $$props.selectedCount);
			if ('keywords' in $$props) $$invalidate(2, keywords = $$props.keywords);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [categories, selectedCount, keywords, click_handler];
	}

	class SkillsPage extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "SkillsPage",
				options,
				id: create_fragment$7.name
			});
		}
	}

	const educationTimeline = [
	    {
	        title: 'University of Amsterdam',
	        subtitle: 'Master Software Engineering',
	        description: 'Thesis: Risk assessment in agile software development using machine learning',
	        bullets: [
	            'Requirements engineering',
	            'Software specification and testing',
	            'Software evolution',
	            'Software process',
	            'Embedded software and Systems',
	            'DevOps and cloud based software'
	        ],
	        date: '2022 May',
	        image: getImage('uva_logo')
	    },
	    {
	        title: 'University of Amsterdam',
	        subtitle: 'Pre-Master',
	        description: '',
	        bullets: ['Compiler construction', 'Operating systems', 'Automata and formal languages'],
	        date: '2019 Aug',
	        image: getImage('uva_logo')
	    },
	    {
	        title: 'Hogeschool van Amsterdam (AUAS)',
	        subtitle: 'Bachelor Informatica',
	        description: '',
	        bullets: ['Major Software Engineering', 'Minor Digital Forensics'],
	        date: '2018 Jun',
	        image: getImage('hva_logo')
	    },
	    {
	        title: 'Mid Sweden University',
	        subtitle: 'International Summer School',
	        description: 'International summer school with a focus on sustainability.',
	        date: '2016 Jul',
	        image: getImage('miun_logo')
	    },
	    {
	        title: 'Gerrit van der Veen College',
	        subtitle: 'HAVO',
	        description: 'High school with Nature and Technology profile.',
	        date: '2013 Jun',
	    }
	];

	/* src/routes/Education.svelte generated by Svelte v4.2.20 */
	const file$6 = "src/routes/Education.svelte";

	// (17:4) <Card class="pb-6 flex-col">
	function create_default_slot$2(ctx) {
		let h1;
		let t1;
		let styledtimeline;
		let current;

		styledtimeline = new StyledTimeLine({
				props: { timeLineItems: /*timelineItems*/ ctx[0] },
				$$inline: true
			});

		const block = {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Education";
				t1 = space();
				create_component(styledtimeline.$$.fragment);
				attr_dev(h1, "class", "text-center my-4 font-bold text-lg");
				add_location(h1, file$6, 17, 8, 656);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				insert_dev(target, t1, anchor);
				mount_component(styledtimeline, target, anchor);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(styledtimeline.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(styledtimeline.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
					detach_dev(t1);
				}

				destroy_component(styledtimeline, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$2.name,
			type: "slot",
			source: "(17:4) <Card class=\\\"pb-6 flex-col\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$6(ctx) {
		let meta0;
		let meta1;
		let meta2;
		let t;
		let div;
		let card;
		let current;

		card = new Card({
				props: {
					class: "pb-6 flex-col",
					$$slots: { default: [create_default_slot$2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				meta0 = element("meta");
				meta1 = element("meta");
				meta2 = element("meta");
				t = space();
				div = element("div");
				create_component(card.$$.fragment);
				document.title = "Meerman";
				attr_dev(meta0, "name", "description");
				attr_dev(meta0, "content", "A list of formal education that Dries followed.");
				add_location(meta0, file$6, 10, 4, 296);
				attr_dev(meta1, "name", "author");
				attr_dev(meta1, "content", "Dries Meerman");
				add_location(meta1, file$6, 11, 4, 384);
				attr_dev(meta2, "name", "keywords");
				attr_dev(meta2, "content", "Dries Meerman, Meerman, Software Engineer, Software Engineering, Master, MSc, Bachelor, BSc, University of Amsterdam, UvA, HvA");
				add_location(meta2, file$6, 12, 4, 433);
				add_location(div, file$6, 15, 0, 609);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, meta0);
				append_dev(document.head, meta1);
				append_dev(document.head, meta2);
				insert_dev(target, t, anchor);
				insert_dev(target, div, anchor);
				mount_component(card, div, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const card_changes = {};

				if (dirty & /*$$scope*/ 2) {
					card_changes.$$scope = { dirty, ctx };
				}

				card.$set(card_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(card.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(card.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(div);
				}

				detach_dev(meta0);
				detach_dev(meta1);
				detach_dev(meta2);
				destroy_component(card);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$6.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$6($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Education', slots, []);
		const timelineItems = educationTimeline;
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Education> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			educationTimeline,
			Card,
			StyledTimeLine,
			timelineItems
		});

		return [timelineItems];
	}

	class Education extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Education",
				options,
				id: create_fragment$6.name
			});
		}
	}

	// Generated at 2025-10-16T22:16:03.914Z
	const articlesString = `[
  {
    "filename": "dr-001.md",
    "title": "The journey of starting a blog",
    "tags": [
      "svelte",
      "blog",
      "markdown"
    ],
    "summary": "In this article, the author reflects on their journey of starting a blog after completing their Master's degree, driven by a desire to enhance their writing skills, conduct research, and share knowledge. They discuss the essential requirements for their blog, including the need for control over its hosting, a preferred Markdown format for writing, and the implementation of RSS feeds for content distribution. Choosing a custom tech stack, they extended their existing website using Rollup, Svelte, and Markdown plugins while improving the appearance with Tailwind CSS. They automated RSS feed generation with the help of ChatGPT, although future enhancements, such as automating image publishing and addressing Markdown footnotes, are considered. The article concludes with a reminder to prioritize project completion over perfection and to utilize available tools for efficiency.",
    "date": "2023-05-28T00:00:00.000Z",
    "author": "Dries Meerman",
    "ID": 1,
    "url": "https://meerman.xyz/#/blog/dr-001"
  },
  {
    "filename": "dr-002.md",
    "title": "Finishing projects",
    "tags": [
      "process"
    ],
    "summary": "This article explores the common issue of unfinished side projects and suggests techniques to overcome it. The author discusses the challenge of side projects losing momentum over time due to the absence of external pressures like deadlines. They emphasize the importance of completing projects, as it hones valuable skills, allows for user feedback, and frees up mental space for creativity. The 'Cult of Done Manifesto' is referenced to underscore the significance of finishing. To prevent projects from languishing, the author recommends preparation, cheating by using existing components, setting clear goals, and collaborating with others. These strategies help maintain focus, enhance productivity, and increase the likelihood of project completion. Ultimately, the article acknowledges that there is no foolproof solution but suggests that these techniques have proven effective for the author in finishing more projects.",
    "date": "2023-09-25T00:00:00.000Z",
    "author": "Dries Meerman",
    "ID": 2,
    "url": "https://meerman.xyz/#/blog/dr-002"
  },
  {
    "filename": "dr-003.md",
    "title": "Hybrid automation for one-off tasks",
    "tags": [
      "process",
      "automation",
      "ChatGPT",
      "scripting"
    ],
    "date": "2023-10-04T00:00:00.000Z",
    "author": "Dries Meerman",
    "ID": 3,
    "summary": "The blog post titled 'Hybrid Automation' explores a practical approach to combining automation and manual tasks to achieve optimal efficiency. The author introduces the concept of hybrid automation, where automation is applied to tasks that are easily automated, and manual tasks are retained if they are not too tedious and don't benefit significantly from automation. The post delves into the Pareto Principle, commonly known as the 80/20 rule, where 80% of outcomes come from 20% of causes, emphasizing the efficient use of resources. The author provides a real-life example involving the automated downloading of images from a website and explains how they leveraged the ChatGPT tool to simplify the process. They describe the creation of scripts for obtaining image links, copying the data to the clipboard, and a bash script for downloading the images. The post concludes by highlighting the benefits of breaking tasks into manageable components that can be easily automated or manually executed to bridge gaps effectively.",
    "url": "https://meerman.xyz/#/blog/dr-003"
  },
  {
    "filename": "dr-004.md",
    "title": "Swift 5.9 - TL;DR",
    "tags": [
      "Swift"
    ],
    "date": "2024-01-13T00:00:00.000Z",
    "author": "Dries Meerman",
    "summary": "Swift 5.9, released with Xcode 15.2, introduces significant language improvements, including bi-directional C++ compatibility, macros, and the use of 'if' and 'switch' as expressions for more readable code. Debugging sees a speed boost, particularly in 'p' and 'po' commands, and there are notable enhancements to the Swift Package Manager and the Swift-syntax project. The author is particularly excited about the potential for cleaner code with 'if' expressions and the anticipated improvements in code analysis tools. This update also brings advancements for Swift on Windows platforms.",
    "ID": 4,
    "url": "https://meerman.xyz/#/blog/dr-004"
  },
  {
    "filename": "dr-005.md",
    "title": "Artificially enhanced IDE's and sidequests",
    "tags": [
      "ai",
      "programming",
      "ci",
      "side-quest",
      "ide"
    ],
    "date": "2024-09-22T00:00:00.000Z",
    "author": "Dries Meerman",
    "summary": "The article discusses the Dries' experience with using AI-enhanced IDEs, specifically Cursor, to address issues on their website, including markdown flavour inconsistencies and large bundle sizes. Initially hesitant to fix these problems due to their complexity and existing functionality, the author explores how AI can assist in making the process faster and less tedious. They delve into the complexities of markdown variations and their desire to implement footnotes, eventually using AI to optimize the site's structure and reduce bundle sizes. While the AI helped streamline tasks, it also introduced some minor bugs, such as incorrect file capitalization, highlighting both the potential and limitations of AI-driven development. Overall, the author found AI tools useful for problem-solving and workflow improvements, despite occasional challenges.",
    "ID": "005",
    "url": "https://meerman.xyz/#/blog/dr-005"
  },
  {
    "filename": "dr-006.md",
    "date": "2025-04-16T00:00:00.000Z",
    "title": "Exploring the Model Context Protocol",
    "tags": [
      "article",
      "ai",
      "MCP"
    ],
    "author": "Dries Meerman",
    "ID": "006",
    "summary": "Inspired by recent advancements in agentic AI like VS Code's agent mode and Google's Agent2Agent protocol, the author explores the Model Context Protocol (MCP), an open standard allowing Large Language Models (LLMs) to request external context and utilize tools for more accurate, less hallucinatory results. Motivated to apply this to their ServiceNow expertise, the author developed a custom MCP server (available on GitHub) to retrieve table schemas, detailing the building process using official guides and the MCP Inspector tool for local testing. The article concludes by demonstrating the successful integration of this server into the Cursor editor, where an LLM agent uses the custom tool to fetch live ServiceNow data and generate code based on it, showcasing MCP's potential to enhance AI coding assistants with reliable, real-world context and actions.",
    "url": "https://meerman.xyz/#/blog/dr-006"
  },
  {
    "filename": "dr-007.md",
    "title": "30 bits of unsolicited advice",
    "tags": [
      "advice"
    ],
    "date": "2025-10-17T00:00:00.000Z",
    "author": "Dries Meerman",
    "ID": "007",
    "summary": "This blog post, written upon turning 30, is a reflection on lessons learned through trial, curiosity, and self-discovery in one’s 20s. It’s not a list of rigid rules, but a collection of practical and philosophical reminders—about acting instead of overthinking, creating without fear, nurturing curiosity, building habits that last, and embracing both the weird and the ordinary. It’s about realizing that growth comes from showing up, experimenting, and engaging with life, while learning to balance reflection with action.",
    "url": "https://meerman.xyz/#/blog/dr-007"
  }
]`;
	const articles = JSON.parse(articlesString);

	class MarkdownItem {
	    constructor(file) {
	        const slug = file.filename
	            .toLowerCase()
	            .replace(/\.md$/, '');
	        const permalink = `/#/blog/${slug}`;

	        this.slug = slug;
	        this.date = new Date(file.date);
	        this.ID = String(file.ID).padStart(3, '0');
	        this.permalink = permalink;
	        this.title = file.title;
	        this.author = file.author;
	        this.summary = file.summary;
	        this.tags = file.tags || [];
	        this._html = null; // Add this line
	    }

	    /**
	     * This method returns the html of the article file, which it gets based
	     * on the slug. It caches the result for subsequent calls.
	     * @returns {Promise<String>} html of the article file
	     */
	    async getHtml() {
	        if (this._html === null) {
	            const response = await fetch(`/articles/${this.slug}.html`);
	            this._html = await response.text();
	        }
	        return this._html;
	    }
	}

	/**
	 *
	 * @param {MarkdownItem} lhs
	 * @param {MarkdownItem} rhs
	 * @returns {boolean}
	 */
	function sortByDate(lhs, rhs) {
	    return rhs.date - lhs.date;
	}

	/**
	 *
	 * @param {String} name
	 * @returns {MarkdownItem}
	 */
	function findPost(name) {
	    let post = articles.find((post) => {
	        return post.filename.includes(name);
	    });

	    if (!post) {
	        console.error(`No post found for ${name}`);
	        return null;
	    }

	    return new MarkdownItem(post);
	}

	function getAllArticles() {
	    return articles.map(a => new MarkdownItem(a)).sort(sortByDate)
	}

	/* src/routes/blog/BlogIndex.svelte generated by Svelte v4.2.20 */
	const file$5 = "src/routes/blog/BlogIndex.svelte";

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[3] = list[i];
		child_ctx[5] = i;
		return child_ctx;
	}

	// (55:0) {:else}
	function create_else_block$2(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				div.textContent = "Error no articles found";
				add_location(div, file$5, 55, 4, 2035);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$2.name,
			type: "else",
			source: "(55:0) {:else}",
			ctx
		});

		return block;
	}

	// (35:0) {#if posts.length >= 1}
	function create_if_block$3(ctx) {
		let h1;
		let t1;
		let card;
		let current;

		card = new Card({
				props: {
					class: "p-6",
					$$slots: { default: [create_default_slot$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Digital Reflections";
				t1 = space();
				create_component(card.$$.fragment);
				attr_dev(h1, "class", "justify-center flex text-2xl pb-12");
				attr_dev(h1, "title", "This name was chosen as an homage to Seneca's reflections and the fact that it spells out the first letters of my name.");
				add_location(h1, file$5, 35, 4, 1026);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				insert_dev(target, t1, anchor);
				mount_component(card, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const card_changes = {};

				if (dirty & /*$$scope*/ 64) {
					card_changes.$$scope = { dirty, ctx };
				}

				card.$set(card_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(card.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(card.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
					detach_dev(t1);
				}

				destroy_component(card, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$3.name,
			type: "if",
			source: "(35:0) {#if posts.length >= 1}",
			ctx
		});

		return block;
	}

	// (49:16) {#if !isLast(posts, index)}
	function create_if_block_1$2(ctx) {
		let hr;

		const block = {
			c: function create() {
				hr = element("hr");
				attr_dev(hr, "class", "mt-2");
				add_location(hr, file$5, 49, 20, 1930);
			},
			m: function mount(target, anchor) {
				insert_dev(target, hr, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(hr);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$2.name,
			type: "if",
			source: "(49:16) {#if !isLast(posts, index)}",
			ctx
		});

		return block;
	}

	// (39:12) {#each posts as post, index}
	function create_each_block$1(ctx) {
		let article;
		let a;
		let div;
		let h2;
		let t0_value = /*post*/ ctx[3].ID + "";
		let t0;
		let t1;
		let t2_value = /*post*/ ctx[3].title + "";
		let t2;
		let t3;
		let p;
		let t7;
		let show_if = !isLast(/*posts*/ ctx[0], /*index*/ ctx[5]);
		let if_block_anchor;
		let mounted;
		let dispose;
		let if_block = show_if && create_if_block_1$2(ctx);

		const block = {
			c: function create() {
				article = element("article");
				a = element("a");
				div = element("div");
				h2 = element("h2");
				t0 = text(t0_value);
				t1 = text(" - ");
				t2 = text(t2_value);
				t3 = space();
				p = element("p");
				p.textContent = `[${isoDate(/*post*/ ctx[3].date)}]`;
				t7 = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
				attr_dev(h2, "class", "text-l hover:decoration-blue-400");
				attr_dev(h2, "title", /*post*/ ctx[3].summary);
				add_location(h2, file$5, 42, 28, 1579);
				attr_dev(p, "class", "text-xs min-w-fit ml-4 lh-inherit svelte-bk69h9");
				add_location(p, file$5, 43, 28, 1704);
				attr_dev(div, "class", "flex flex-row justify-between");
				add_location(div, file$5, 41, 24, 1506);
				attr_dev(a, "class", "cursor-pointer");
				attr_dev(a, "href", /*post*/ ctx[3].permalink);
				add_location(a, file$5, 40, 20, 1406);
				attr_dev(article, "class", /*index*/ ctx[5] === 0 ? '' : 'pt-6');
				add_location(article, file$5, 39, 16, 1339);
			},
			m: function mount(target, anchor) {
				insert_dev(target, article, anchor);
				append_dev(article, a);
				append_dev(a, div);
				append_dev(div, h2);
				append_dev(h2, t0);
				append_dev(h2, t1);
				append_dev(h2, t2);
				append_dev(div, t3);
				append_dev(div, p);
				insert_dev(target, t7, anchor);
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);

				if (!mounted) {
					dispose = listen_dev(a, "click", articleClicked, false, false, false, false);
					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(article);
					detach_dev(t7);
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$1.name,
			type: "each",
			source: "(39:12) {#each posts as post, index}",
			ctx
		});

		return block;
	}

	// (37:4) <Card class="p-6">
	function create_default_slot$1(ctx) {
		let div;
		let each_value = ensure_array_like_dev(/*posts*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(div, "class", "w-full");
				add_location(div, file$5, 37, 8, 1259);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*isLast, posts, articleClicked, isoDate*/ 7) {
					each_value = ensure_array_like_dev(/*posts*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$1.name,
			type: "slot",
			source: "(37:4) <Card class=\\\"p-6\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$5(ctx) {
		let meta0;
		let meta1;
		let meta2;
		let t0;
		let current_block_type_index;
		let if_block;
		let t1;
		let div;
		let a;
		let svg;
		let g3;
		let g2;
		let g1;
		let path0;
		let g0;
		let path1;
		let path2;
		let path3;
		let current;
		const if_block_creators = [create_if_block$3, create_else_block$2];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*posts*/ ctx[0].length >= 1) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				meta0 = element("meta");
				meta1 = element("meta");
				meta2 = element("meta");
				t0 = space();
				if_block.c();
				t1 = space();
				div = element("div");
				a = element("a");
				svg = svg_element("svg");
				g3 = svg_element("g");
				g2 = svg_element("g");
				g1 = svg_element("g");
				path0 = svg_element("path");
				g0 = svg_element("g");
				path1 = svg_element("path");
				path2 = svg_element("path");
				path3 = svg_element("path");
				document.title = "Meerman - Blog";
				attr_dev(meta0, "name", "description");
				attr_dev(meta0, "content", "Digital reflections - A collection of articles about software development, technology, and other topics.");
				add_location(meta0, file$5, 29, 4, 699);
				attr_dev(meta1, "name", "author");
				attr_dev(meta1, "content", "Dries Meerman");
				add_location(meta1, file$5, 30, 4, 847);
				attr_dev(meta2, "name", "keywords");
				attr_dev(meta2, "content", "Dries Meerman, Meerman, Software Engineer, Blog");
				add_location(meta2, file$5, 31, 4, 897);
				attr_dev(path0, "d", "M468.2,489.5H20.8C9.4,489.5,0,480.1,0,468.7V21.3C0,9.9,9.4,0.5,20.8,0.5h448.4c11.4,0,20.8,9.4,20.8,20.8v448.4     C489,480.1,479.6,489.5,468.2,489.5z M40.6,448.9h407.8V41.1H40.6V448.9z");
				add_location(path0, file$5, 63, 17, 2396);
				attr_dev(path1, "d", "M260.1,419.8c-11.4,0-20.8-9.4-20.8-20.8c0-77-62.4-139.4-139.4-139.4c-11.4,0-20.8-9.4-20.8-20.8      c0-11.4,9.4-20.8,20.8-20.8c99.9,0,181,81.1,181,181C280.9,410.4,271.5,419.8,260.1,419.8z");
				add_location(path1, file$5, 64, 19, 2613);
				attr_dev(path2, "d", "M347.5,419.8c-11.4,0-20.8-9.4-20.8-20.8c0-124.8-102-227.8-227.8-227.8c-11.4,0-20.8-9.4-20.8-20.8s9.4-20.8,20.8-20.8      c147.7,0,268.4,120.7,268.4,268.4C368.3,410.4,358.9,419.8,347.5,419.8z");
				add_location(path2, file$5, 65, 20, 2834);
				attr_dev(path3, "d", "M173.7,419.8c-11.4,0-20.8-9.4-20.8-20.8c0-29.1-23.9-53.1-53.1-53.1c-11.4,0-20.8-9.4-20.8-20.8      c0-11.4,9.4-20.8,20.8-20.8c52,0,94.7,42.7,94.7,94.7C194.5,410.4,185.2,419.8,173.7,419.8z");
				add_location(path3, file$5, 66, 20, 3058);
				add_location(g0, file$5, 64, 16, 2610);
				add_location(g1, file$5, 63, 14, 2393);
				add_location(g2, file$5, 63, 11, 2390);
				add_location(g3, file$5, 63, 8, 2387);
				attr_dev(svg, "class", "dark:fill-white");
				attr_dev(svg, "width", "25");
				attr_dev(svg, "height", "25");
				attr_dev(svg, "version", "1.1");
				attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
				attr_dev(svg, "viewBox", "0 0 490 490");
				attr_dev(svg, "xml:space", "preserve");
				add_location(svg, file$5, 61, 8, 2176);
				attr_dev(a, "href", "/feed.xml");
				add_location(a, file$5, 60, 4, 2146);
				attr_dev(div, "class", "rss-icon svelte-bk69h9");
				attr_dev(div, "title", "This will open the rss feed");
				add_location(div, file$5, 59, 0, 2082);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, meta0);
				append_dev(document.head, meta1);
				append_dev(document.head, meta2);
				insert_dev(target, t0, anchor);
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, div, anchor);
				append_dev(div, a);
				append_dev(a, svg);
				append_dev(svg, g3);
				append_dev(g3, g2);
				append_dev(g2, g1);
				append_dev(g1, path0);
				append_dev(g1, g0);
				append_dev(g0, path1);
				append_dev(g0, path2);
				append_dev(g0, path3);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if_block.p(ctx, dirty);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
					detach_dev(div);
				}

				detach_dev(meta0);
				detach_dev(meta1);
				detach_dev(meta2);
				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function isLast(list, index) {
		return list.length - 1 === index;
	}

	function isoDate(date) {
		return date.toISOString().split('T')[0];
	}

	function articleClicked() {
		if (window && window.tinylytics) {
			window.tinylytics.triggerUpdate();
		}
	}

	function instance$5($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('BlogIndex', slots, []);
		const posts = getAllArticles();
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BlogIndex> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			Card,
			getAllArticles,
			posts,
			isLast,
			isoDate,
			articleClicked
		});

		return [posts, isLast, isoDate];
	}

	class BlogIndex extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { posts: 0, isLast: 1, isoDate: 2 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "BlogIndex",
				options,
				id: create_fragment$5.name
			});
		}

		get posts() {
			return this.$$.ctx[0];
		}

		set posts(value) {
			throw new Error("<BlogIndex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get isLast() {
			return isLast;
		}

		set isLast(value) {
			throw new Error("<BlogIndex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get isoDate() {
			return isoDate;
		}

		set isoDate(value) {
			throw new Error("<BlogIndex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/routes/blog/Article.svelte generated by Svelte v4.2.20 */

	const { console: console_1, document: document_1 } = globals;
	const file$4 = "src/routes/blog/Article.svelte";

	// (98:15) 
	function create_if_block_3(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				attr_dev(div, "class", "prose dark:prose-invert max-w-none list-disc dark:marker:text-white svelte-1s3lx2b");
				add_location(div, file$4, 98, 4, 2943);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				div.innerHTML = /*htmlContent*/ ctx[0];
			},
			p: function update(ctx, dirty) {
				if (dirty & /*htmlContent*/ 1) div.innerHTML = /*htmlContent*/ ctx[0];		},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_3.name,
			type: "if",
			source: "(98:15) ",
			ctx
		});

		return block;
	}

	// (92:23) 
	function create_if_block_2(ctx) {
		let div;
		let h2;
		let t1;
		let p;
		let t2;
		let t3;
		let a;

		const block = {
			c: function create() {
				div = element("div");
				h2 = element("h2");
				h2.textContent = "Oops! Something went wrong";
				t1 = space();
				p = element("p");
				t2 = text(/*errorMessage*/ ctx[2]);
				t3 = space();
				a = element("a");
				a.textContent = "Return to blog list";
				attr_dev(h2, "class", "svelte-1s3lx2b");
				add_location(h2, file$4, 93, 8, 2797);
				add_location(p, file$4, 94, 8, 2841);
				attr_dev(a, "href", "#/blog");
				attr_dev(a, "class", "svelte-1s3lx2b");
				add_location(a, file$4, 95, 8, 2871);
				attr_dev(div, "class", "error-message svelte-1s3lx2b");
				add_location(div, file$4, 92, 4, 2761);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, h2);
				append_dev(div, t1);
				append_dev(div, p);
				append_dev(p, t2);
				append_dev(div, t3);
				append_dev(div, a);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*errorMessage*/ 4) set_data_dev(t2, /*errorMessage*/ ctx[2]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2.name,
			type: "if",
			source: "(92:23) ",
			ctx
		});

		return block;
	}

	// (90:0) {#if loading}
	function create_if_block_1$1(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				div.textContent = "Loading...";
				attr_dev(div, "class", "loader svelte-1s3lx2b");
				add_location(div, file$4, 90, 4, 2696);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$1.name,
			type: "if",
			source: "(90:0) {#if loading}",
			ctx
		});

		return block;
	}

	// (182:4) {#if post}
	function create_if_block$2(ctx) {
		let title_value;
		let t0;
		let meta0;
		let t1;
		let meta1;
		let t2;
		let meta2;
		document_1.title = title_value = /*post*/ ctx[3].title;

		const block = {
			c: function create() {
				t0 = space();
				meta0 = element("meta");
				t1 = space();
				meta1 = element("meta");
				t2 = space();
				meta2 = element("meta");
				attr_dev(meta0, "name", "description");
				attr_dev(meta0, "content", /*post*/ ctx[3].summary);
				add_location(meta0, file$4, 183, 4, 4774);
				attr_dev(meta1, "name", "author");
				attr_dev(meta1, "content", /*post*/ ctx[3].author);
				add_location(meta1, file$4, 184, 4, 4829);
				attr_dev(meta2, "name", "keywords");
				attr_dev(meta2, "content", /*post*/ ctx[3].tags.join(', '));
				add_location(meta2, file$4, 185, 4, 4880);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t0, anchor);
				insert_dev(target, meta0, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, meta1, anchor);
				insert_dev(target, t2, anchor);
				insert_dev(target, meta2, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*post*/ 8 && title_value !== (title_value = /*post*/ ctx[3].title)) {
					document_1.title = title_value;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(meta0);
					detach_dev(t1);
					detach_dev(meta1);
					detach_dev(t2);
					detach_dev(meta2);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(182:4) {#if post}",
			ctx
		});

		return block;
	}

	function create_fragment$4(ctx) {
		let t;
		let if_block1_anchor;

		function select_block_type(ctx, dirty) {
			if (/*loading*/ ctx[1]) return create_if_block_1$1;
			if (/*errorMessage*/ ctx[2]) return create_if_block_2;
			if (/*post*/ ctx[3]) return create_if_block_3;
		}

		let current_block_type = select_block_type(ctx);
		let if_block0 = current_block_type && current_block_type(ctx);
		let if_block1 = /*post*/ ctx[3] && create_if_block$2(ctx);

		const block = {
			c: function create() {
				if (if_block0) if_block0.c();
				t = space();
				if (if_block1) if_block1.c();
				if_block1_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block0) if_block0.m(target, anchor);
				insert_dev(target, t, anchor);
				if (if_block1) if_block1.m(document_1.head, null);
				append_dev(document_1.head, if_block1_anchor);
			},
			p: function update(ctx, [dirty]) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if (if_block0) if_block0.d(1);
					if_block0 = current_block_type && current_block_type(ctx);

					if (if_block0) {
						if_block0.c();
						if_block0.m(t.parentNode, t);
					}
				}

				if (/*post*/ ctx[3]) if_block1.p(ctx, dirty);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}

				if (if_block0) {
					if_block0.d(detaching);
				}

				if (if_block1) if_block1.d(detaching);
				detach_dev(if_block1_anchor);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Article', slots, []);
		let { params = {} } = $$props;
		let slug = params.slug ? params.slug.split('#')[0] : ''; // workaround for #footnote links
		let post = findPost(slug);
		let htmlContent = '';
		let loading = true;
		let errorMessage = '';
		let enlargedImage = null;
		loadPost(); // not put in onMount due to funky routing

		async function loadPost() {
			particlesEnabled.set(false);
			$$invalidate(1, loading = true);

			if (post) {
				try {
					$$invalidate(0, htmlContent = await post.getHtml());
					await tick(); // Wait for the DOM to update

					setTimeout(
						() => {
							addImageClickListeners();
							addEscapeKeyListener();
						},
						100
					);
				} catch(error) {
					console.error("Error loading HTML:", error);
					$$invalidate(2, errorMessage = "An error occurred while loading the article.");
				}

				$$invalidate(1, loading = false);
			} else {
				$$invalidate(2, errorMessage = "The requested article could not be found.");
				$$invalidate(1, loading = false);
			}
		}

		function addImageClickListeners() {
			const images = document.querySelectorAll('.prose img');

			images.forEach(img => {
				img.addEventListener('click', event => {
					if (enlargedImage) {
						closeEnlargedImage();
					} else {
						enlargeImage(img);
					}

					event.stopPropagation(); // Prevent the click from bubbling up
				});
			});

			// Add click listener to the document to close enlarged image
			document.addEventListener('click', () => {
				if (enlargedImage) {
					closeEnlargedImage();
				}
			});
		}

		function enlargeImage(img) {
			img.classList.add('enlarged');
			enlargedImage = img;
		}

		function closeEnlargedImage() {
			if (enlargedImage) {
				enlargedImage.classList.remove('enlarged');
				enlargedImage = null;
			}
		}

		function addEscapeKeyListener() {
			document.addEventListener('keydown', event => {
				if (event.key === 'Escape' && enlargedImage) {
					closeEnlargedImage();
				}
			});
		}

		onDestroy(() => {
			particlesEnabled.set(true);
			document.removeEventListener('keydown', addEscapeKeyListener);
			document.removeEventListener('click', closeEnlargedImage);
		});

		const writable_props = ['params'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Article> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('params' in $$props) $$invalidate(4, params = $$props.params);
		};

		$$self.$capture_state = () => ({
			onDestroy,
			particlesEnabled,
			findPost,
			tick,
			params,
			slug,
			post,
			htmlContent,
			loading,
			errorMessage,
			enlargedImage,
			loadPost,
			addImageClickListeners,
			enlargeImage,
			closeEnlargedImage,
			addEscapeKeyListener
		});

		$$self.$inject_state = $$props => {
			if ('params' in $$props) $$invalidate(4, params = $$props.params);
			if ('slug' in $$props) slug = $$props.slug;
			if ('post' in $$props) $$invalidate(3, post = $$props.post);
			if ('htmlContent' in $$props) $$invalidate(0, htmlContent = $$props.htmlContent);
			if ('loading' in $$props) $$invalidate(1, loading = $$props.loading);
			if ('errorMessage' in $$props) $$invalidate(2, errorMessage = $$props.errorMessage);
			if ('enlargedImage' in $$props) enlargedImage = $$props.enlargedImage;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [htmlContent, loading, errorMessage, post, params];
	}

	class Article extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { params: 4 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Article",
				options,
				id: create_fragment$4.name
			});
		}

		get params() {
			throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set params(value) {
			throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Visuals/DrawingOne.svelte generated by Svelte v4.2.20 */

	const file$3 = "src/components/Visuals/DrawingOne.svelte";

	// (127:8) {:else}
	function create_else_block$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("⏸");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$1.name,
			type: "else",
			source: "(127:8) {:else}",
			ctx
		});

		return block;
	}

	// (125:8) {#if pause}
	function create_if_block$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("▶");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$1.name,
			type: "if",
			source: "(125:8) {#if pause}",
			ctx
		});

		return block;
	}

	function create_fragment$3(ctx) {
		let div;
		let canvas;
		let t0;
		let button;
		let t1;
		let t2;
		let p;
		let t3;
		let t4;
		let t5;
		let mounted;
		let dispose;

		function select_block_type(ctx, dirty) {
			if (/*pause*/ ctx[0]) return create_if_block$1;
			return create_else_block$1;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				div = element("div");
				canvas = element("canvas");
				t0 = space();
				button = element("button");
				if_block.c();
				t1 = text("\n        ︎");
				t2 = space();
				p = element("p");
				t3 = text(/*width*/ ctx[1]);
				t4 = text(" × ");
				t5 = text(/*height*/ ctx[2]);
				attr_dev(canvas, "id", "canvas");
				attr_dev(canvas, "class", "flex-grow border-2 border-teal-500 dark:border-sky-600 w-full h-full svelte-1s7u0ho");
				attr_dev(canvas, "width", /*selectedWidth*/ ctx[3]);
				attr_dev(canvas, "height", /*selectedHeight*/ ctx[4]);
				add_location(canvas, file$3, 122, 4, 3977);
				attr_dev(button, "class", "icon-hover pause-button svelte-1s7u0ho");
				add_location(button, file$3, 123, 4, 4138);
				attr_dev(div, "class", "relative flex min-h-[200px] w-full h-full");
				add_location(div, file$3, 121, 0, 3917);
				attr_dev(p, "class", "p-2 text-xs");
				add_location(p, file$3, 131, 0, 4309);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, canvas);
				append_dev(div, t0);
				append_dev(div, button);
				if_block.m(button, null);
				append_dev(button, t1);
				insert_dev(target, t2, anchor);
				insert_dev(target, p, anchor);
				append_dev(p, t3);
				append_dev(p, t4);
				append_dev(p, t5);

				if (!mounted) {
					dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (current_block_type !== (current_block_type = select_block_type(ctx))) {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(button, t1);
					}
				}

				if (dirty & /*width*/ 2) set_data_dev(t3, /*width*/ ctx[1]);
				if (dirty & /*height*/ 4) set_data_dev(t5, /*height*/ ctx[2]);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
					detach_dev(t2);
					detach_dev(p);
				}

				if_block.d();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	const SECONDARY_COLOR_LIGHT = "#15b8a6";
	const SECONDARY_COLOR_DARK = "#0084c7";

	function instance$3($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('DrawingOne', slots, []);
		const WIDTHS = [200, 300, 400, 800];
		const LINESIZES = [15, 30, 45, 60];
		let aspectRatios = [4 / 3, 16 / 9, 16 / 10, 1];
		let aspectIndex = Math.floor(Math.random() * aspectRatios.length);
		let selectedAspectRatio = aspectRatios[aspectIndex];
		let selectedWidthIndex = Math.floor(Math.random() * WIDTHS.length);
		let selectedWidth = WIDTHS[selectedWidthIndex];
		let selectedHeight = selectedWidth * selectedAspectRatio; // 4:3 aspect ratio
		let secondColor = SECONDARY_COLOR_LIGHT;
		let pause = false;
		let width, height = 0;

		darkMode.subscribe(enabled => {
			if (enabled) {
				secondColor = SECONDARY_COLOR_DARK;
			} else {
				secondColor = SECONDARY_COLOR_LIGHT;
			}
		});

		// Still need to fix so onMount works again at some point
		setTimeout(
			() => {
				setupCanvas(12);
			},
			10
		);

		function setupCanvas(fontSize) {
			const canvas = document.getElementById("canvas");
			const ctx = canvas.getContext("2d");
			ctx.font = `${fontSize}px monospace`;
			ctx.fillStyle = "#19d419";
			$$invalidate(1, width = canvas.width);
			$$invalidate(2, height = canvas.height);
			let field = new CanvasAnimator(ctx, canvas.width, canvas.height);
			field.animate(0);
		}

		/**
	 * Private class for handling the canvas animation.
	 * This will be refactored in the next iteration to be more modular and reusable.
	 */
		class CanvasAnimator {
			#ctx;
			#width;
			#height;
			#cellSize;

			constructor(ctx, width, height) {
				this.#ctx = ctx;
				this.#width = width;
				this.#height = height;
				this.#cellSize = 10;
				this.lastRender = 0;
				this.interval = 1000 / 60; // 60fps
				this.timer = 0;
				this.tempOffset = 0;
				this.tempLineLength = LINESIZES[selectedWidthIndex];
			}

			animate(timestamp) {
				if (pause) {
					setTimeout(
						() => {
							this.animate(0);
						},
						50
					);

					return;
				}

				const elapsed = timestamp - this.lastRender;

				if (elapsed > this.interval) {
					this.lastRender = timestamp - elapsed % this.interval;
					this.timer += 1;
					this.tempLineLength += Math.random() * (Math.sin(this.timer) * 20);
					this.drawDebugLines(this.tempOffset++, this.tempLineLength);
				}

				if (this.tempOffset > this.#height || this.offset > this.#width) {
					this.#ctx.clearRect(0, 0, this.#width, this.#height);
					this.tempOffset = Math.cos(this.timer) * 15;
					this.tempLineLength = LINESIZES[selectedWidthIndex];
				}

				requestAnimationFrame(this.animate.bind(this));
			}

			drawDebugLines(offset, lineLength) {
				let xStart = offset;
				let yStart = offset;
				let xEnd = xStart + lineLength;
				let yEnd = yStart + lineLength;

				// draw horizontal line
				this.#ctx.strokeStyle = "black";

				this.#ctx.beginPath();
				this.#ctx.moveTo(xStart, yStart);
				this.#ctx.lineTo(xEnd, yStart);
				this.#ctx.stroke();

				// draw vertical line
				this.#ctx.strokeStyle = secondColor;

				this.#ctx.beginPath();
				this.#ctx.moveTo(xStart, yStart);
				this.#ctx.lineTo(xStart, yEnd);
				this.#ctx.stroke();
			}
		}

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DrawingOne> was created with unknown prop '${key}'`);
		});

		const click_handler = () => {
			$$invalidate(0, pause = !pause);
		};

		$$self.$capture_state = () => ({
			darkMode,
			SECONDARY_COLOR_LIGHT,
			SECONDARY_COLOR_DARK,
			WIDTHS,
			LINESIZES,
			aspectRatios,
			aspectIndex,
			selectedAspectRatio,
			selectedWidthIndex,
			selectedWidth,
			selectedHeight,
			secondColor,
			pause,
			width,
			height,
			setupCanvas,
			CanvasAnimator
		});

		$$self.$inject_state = $$props => {
			if ('aspectRatios' in $$props) aspectRatios = $$props.aspectRatios;
			if ('aspectIndex' in $$props) aspectIndex = $$props.aspectIndex;
			if ('selectedAspectRatio' in $$props) selectedAspectRatio = $$props.selectedAspectRatio;
			if ('selectedWidthIndex' in $$props) selectedWidthIndex = $$props.selectedWidthIndex;
			if ('selectedWidth' in $$props) $$invalidate(3, selectedWidth = $$props.selectedWidth);
			if ('selectedHeight' in $$props) $$invalidate(4, selectedHeight = $$props.selectedHeight);
			if ('secondColor' in $$props) secondColor = $$props.secondColor;
			if ('pause' in $$props) $$invalidate(0, pause = $$props.pause);
			if ('width' in $$props) $$invalidate(1, width = $$props.width);
			if ('height' in $$props) $$invalidate(2, height = $$props.height);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [pause, width, height, selectedWidth, selectedHeight, click_handler];
	}

	class DrawingOne extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "DrawingOne",
				options,
				id: create_fragment$3.name
			});
		}
	}

	/* src/routes/CanvasVisuals.svelte generated by Svelte v4.2.20 */
	const file$2 = "src/routes/CanvasVisuals.svelte";

	// (31:4) <Card class="flex-col">
	function create_default_slot(ctx) {
		let drawingone;
		let current;
		drawingone = new DrawingOne({ $$inline: true });

		const block = {
			c: function create() {
				create_component(drawingone.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(drawingone, target, anchor);
				current = true;
			},
			i: function intro(local) {
				if (current) return;
				transition_in(drawingone.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(drawingone.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(drawingone, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot.name,
			type: "slot",
			source: "(31:4) <Card class=\\\"flex-col\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$2(ctx) {
		let meta0;
		let meta1;
		let meta2;
		let t0;
		let div1;
		let div0;
		let p;
		let t2;
		let h2;
		let span;
		let t4;
		let t5;
		let card;
		let current;

		card = new Card({
				props: {
					class: "flex-col",
					$$slots: { default: [create_default_slot] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				meta0 = element("meta");
				meta1 = element("meta");
				meta2 = element("meta");
				t0 = space();
				div1 = element("div");
				div0 = element("div");
				p = element("p");
				p.textContent = "This page consists of experiments with HTML canvases and me just having some fun with them.";
				t2 = space();
				h2 = element("h2");
				span = element("span");
				span.textContent = "# 1";
				t4 = text("\n        Debug lines");
				t5 = space();
				create_component(card.$$.fragment);
				document.title = "Meerman";
				attr_dev(meta0, "name", "description");
				attr_dev(meta0, "content", "");
				add_location(meta0, file$2, 16, 4, 376);
				attr_dev(meta1, "name", "author");
				attr_dev(meta1, "content", "Dries Meerman");
				add_location(meta1, file$2, 17, 4, 417);
				attr_dev(meta2, "name", "keywords");
				attr_dev(meta2, "content", "Dries Meerman, Meerman, Software Engineer, Software Engineering, Master, MSc, Bachelor, BSc, University of Amsterdam, UvA, HvA");
				add_location(meta2, file$2, 18, 4, 466);
				add_location(p, file$2, 23, 4, 681);
				attr_dev(div0, "class", "pt-4 pb-24");
				add_location(div0, file$2, 22, 4, 652);
				add_location(span, file$2, 27, 8, 842);
				attr_dev(h2, "class", "text-xl pb-4 select-none");
				add_location(h2, file$2, 26, 4, 796);
				add_location(div1, file$2, 21, 0, 642);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, meta0);
				append_dev(document.head, meta1);
				append_dev(document.head, meta2);
				insert_dev(target, t0, anchor);
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				append_dev(div0, p);
				append_dev(div1, t2);
				append_dev(div1, h2);
				append_dev(h2, span);
				append_dev(h2, t4);
				append_dev(div1, t5);
				mount_component(card, div1, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const card_changes = {};

				if (dirty & /*$$scope*/ 1) {
					card_changes.$$scope = { dirty, ctx };
				}

				card.$set(card_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(card.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(card.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(div1);
				}

				detach_dev(meta0);
				detach_dev(meta1);
				detach_dev(meta2);
				destroy_component(card);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('CanvasVisuals', slots, []);
		particlesEnabled.set(false);

		onDestroy(() => {
			particlesEnabled.set(true);
		});

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CanvasVisuals> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			onDestroy,
			Card,
			DrawingOne,
			particlesEnabled
		});

		return [];
	}

	class CanvasVisuals extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "CanvasVisuals",
				options,
				id: create_fragment$2.name
			});
		}
	}

	const toolDataBySection = {
	  largerCliTools: [
	    { name: 'Ghosty', description: 'CLI tool', icon: '/icons/ghosty.svg' },
	    { name: 'Warp', description: 'CLI tool', icon: '/icons/warp.svg' },
	    { name: 'git', description: 'Version control system', icon: '/icons/git.svg' },
	    { name: 'ffmpeg', description: 'A complete, cross-platform solution to record, convert and stream audio and video.', icon: '/icons/bash.svg' },
	    // { name: 'rclone', description: 'Command-line program to manage files on cloud storage.', icon: '/icons/bash.svg' },
	    { name: 'homebrew', description: 'The Missing Package Manager for macOS (or Linux).', icon: '/icons/homebrew.svg' },
	    { name: 'docker', description: 'Platform for developing, shipping, and running applications in containers.', icon: '/icons/docker.svg' },
	    { name: 'yazi', description: 'A terminal file manager. Install with `brew install yazi ffmpeg sevenzip jq poppler fd ripgrep fzf zoxide resvg imagemagick font-symbols-only-nerd-font`.', icon: '/icons/bash.svg' },
	  ],
	  unixUtilities: [
	    { name: 'fzf', url: 'https://github.com/junegunn/fzf', description: 'Fuzzy finder, really nice for finding files and it has a great shell integration, for searching history.', icon: '/icons/bash.svg' },
	    { name: 'fzurl', url: 'https://github.com/DriesMeerman/utils', description: 'Custom quick fuzzy URL opener based on fzf.', icon: '/icons/bash.svg' },
	    { name: 'pbcopy', description: 'macOS command-line utility to copy to clipboard.', icon: '/icons/bash.svg' },
	    { name: 'pbpaste', description: 'macOS command-line utility to paste from clipboard.', icon: '/icons/bash.svg' },
	    { name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep', description: 'Recursively searches directories for a regex pattern.', icon: '/icons/bash.svg' },
	    { name: 'bat', url: 'https://github.com/sharkdp/bat', description: 'A cat(1) clone with syntax highlighting and Git integration.', icon: '/icons/bash.svg' },
	    { name: 'ssh', description: 'Secure Shell for remote login and other secure network services.', icon: '/icons/bash.svg' },
	    { name: 'curl', url: 'https://curl.se/', description: 'Command-line tool for transferring data with URLs.', icon: '/icons/bash.svg' },
	    { name: 'wget', url: 'https://www.gnu.org/software/wget/', description: 'Network utility to retrieve files from the Web.', icon: '/icons/bash.svg' },
	    { name: 'awk', url: 'https://www.gnu.org/software/gawk/', description: 'Pattern scanning and processing language.', icon: '/icons/bash.svg' },
	    { name: 'sed', url: 'https://www.gnu.org/software/sed/', description: 'Stream editor for performing basic text transformations.', icon: '/icons/bash.svg' },
	    { name: 'tail', url: 'https://www.gnu.org/software/coreutils/manual/html_node/tail-invocation.html', description: 'Outputs the last part of files.', icon: '/icons/bash.svg' },
	    { name: 'cron', url: 'https://en.wikipedia.org/wiki/Cron', description: 'Time-based job scheduler in Unix-like computer operating systems. Great for simple script automation.', icon: '/icons/bash.svg' },
	    { name: 'tree', url: 'https://mama.indstate.edu/users/ice/tree/', description: 'Displays directory paths and files in a tree-like format.', icon: '/icons/bash.svg' },
	    { name: 'df', url: 'https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html', description: 'Reports file system disk space usage.', icon: '/icons/bash.svg' },
	    { name: 'mv', url: 'https://www.gnu.org/software/coreutils/manual/html_node/mv-invocation.html', description: 'Move or rename files and directories.', icon: '/icons/bash.svg' },
	    { name: 'cp', url: 'https://www.gnu.org/software/coreutils/manual/html_node/cp-invocation.html', description: 'Copy files and directories.', icon: '/icons/bash.svg' },
	    { name: 'chmod', url: 'https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html', description: 'Change file mode bits (permissions).', icon: '/icons/bash.svg' },
	    { name: 'python -m http.server 8000', description: 'Built in python webserver to serve current directory.', icon: '/icons/bash.svg' },
	    { name: 'ifconfig -a | grep inet', description: 'Find local IP address on MacOS. For Linux`ifconfig -a | grep inet` (macOS) or `ip addr | grep inet` (Linux).', icon: '/icons/bash.svg' },
	    { name: 'entr', url: 'https://github.com/eradman/entr/', description: 'Run arbitrary commands when files change.', icon: '/icons/bash.svg' },
	    { name: 'lazygit', url: 'https://github.com/jesseduffield/lazygit', description: 'A simple terminal UI for git commands.', icon: '/icons/git.svg' },
	  ],

	  devTools: [
	    { name: 'Cursor', description: 'AI-powered code editor.', icon: '/icons/cursor.svg' },
	    { name: 'JetBrains IDEs', description: 'Suite of IDEs for various languages (e.g., IntelliJ IDEA, PyCharm, WebStorm).', icon: '/icons/intellij.svg' },
	    { name: 'VSCode', description: 'Visual Studio Code, a popular free source code editor.', icon: '/icons/vscode.svg' },
	    { name: 'neovim', description: 'Hyperextensible Vim-based text editor, often used in the terminal.', icon: '/icons/neovim.svg' },
	    { name: 'Obsidian', description: 'A powerful knowledge base and note-taking application.', icon: '/icons/obsidian.svg' },
	    { name: 'Xcode', description: 'IDE for macOS development.', icon: '/icons/apple.svg' },
	    { name: 'Raycast', description: 'Launcher with file search, app search, emoji, calculator, custom shortcuts, and more.', icon: '/icons/raycast.svg' },
	    { name: 'Bruno', description: 'API client for exploring and testing APIs (similar to Postman).', icon: '/icons/swagger.svg' },
	  ],
	};

	const tools = toolDataBySection.largerCliTools
	                        // .concat(toolDataBySection.unixUtilities)
	                        // .concat(toolDataBySection.macosSpecific)
	                        .concat(toolDataBySection.devTools);
	const unixTools = toolDataBySection.unixUtilities;

	/* src/routes/Tools.svelte generated by Svelte v4.2.20 */

	const { Error: Error_1 } = globals;
	const file$1 = "src/routes/Tools.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[0] = list[i];
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[0] = list[i];
		return child_ctx;
	}

	// (59:20) {:catch error}
	function create_catch_block(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = `Error loading icon: ${/*error*/ ctx[6].message}`;
				add_location(p, file$1, 59, 24, 2273);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_catch_block.name,
			type: "catch",
			source: "(59:20) {:catch error}",
			ctx
		});

		return block;
	}

	// (57:20) {:then svgContent}
	function create_then_block(ctx) {
		let html_tag;
		let raw_value = adaptSvgString(/*svgContent*/ ctx[5], iconSize, iconSize) + "";
		let html_anchor;

		const block = {
			c: function create() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m: function mount(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert_dev(target, html_anchor, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(html_anchor);
					html_tag.d();
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_then_block.name,
			type: "then",
			source: "(57:20) {:then svgContent}",
			ctx
		});

		return block;
	}

	// (55:47)                          <p>Loading icon...</p>                     {:then svgContent}
	function create_pending_block(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = "Loading icon...";
				add_location(p, file$1, 55, 24, 2073);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_pending_block.name,
			type: "pending",
			source: "(55:47)                          <p>Loading icon...</p>                     {:then svgContent}",
			ctx
		});

		return block;
	}

	// (52:8) {#each tools as tool}
	function create_each_block_1(ctx) {
		let div1;
		let div0;
		let t0;
		let h2;
		let t2;

		let info = {
			ctx,
			current: null,
			token: null,
			hasCatch: true,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 5,
			error: 6
		};

		handle_promise(getIcon(/*tool*/ ctx[0].icon), info);

		const block = {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				info.block.c();
				t0 = space();
				h2 = element("h2");
				h2.textContent = `${/*tool*/ ctx[0].name}`;
				t2 = space();
				attr_dev(div0, "class", "text-center flex justify-center items-center overflow-hidden w-24 h-24");
				add_location(div0, file$1, 53, 16, 1916);
				attr_dev(h2, "class", "pt-2 text-center");
				add_location(h2, file$1, 62, 16, 2384);
				attr_dev(div1, "class", "bg-stone-200 dark:bg-gray-700 p-4 rounded-md backdrop-blur-sm w-32 flex-none bg-opacity-80 dark:bg-opacity-75");
				add_location(div1, file$1, 52, 12, 1776);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				info.block.m(div0, info.anchor = null);
				info.mount = () => div0;
				info.anchor = null;
				append_dev(div1, t0);
				append_dev(div1, h2);
				append_dev(div1, t2);
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				update_await_block_branch(info, ctx, dirty);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				info.block.d();
				info.token = null;
				info = null;
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1.name,
			type: "each",
			source: "(52:8) {#each tools as tool}",
			ctx
		});

		return block;
	}

	// (77:24) {#if tool.url}
	function create_if_block(ctx) {
		let if_block_anchor;

		function select_block_type(ctx, dirty) {
			if (/*tool*/ ctx[0].url.includes('github')) return create_if_block_1;
			return create_else_block;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(77:24) {#if tool.url}",
			ctx
		});

		return block;
	}

	// (85:28) {:else}
	function create_else_block(ctx) {
		let a;
		let svg;
		let g1;
		let g0;
		let path0;
		let path1;

		const block = {
			c: function create() {
				a = element("a");
				svg = svg_element("svg");
				g1 = svg_element("g");
				g0 = svg_element("g");
				path0 = svg_element("path");
				path1 = svg_element("path");
				attr_dev(path0, "d", "M245.531,245.532c4.893-4.896,11.42-7.589,18.375-7.589s13.482,2.696,18.375,7.589l49.734,49.734    c1.723,1.72,4.058,2.689,6.49,2.689s4.771-0.967,6.49-2.689l49.733-49.734c1.724-1.72,2.69-4.058,2.69-6.49    c0-2.433-0.967-4.771-2.69-6.49l-49.733-49.734c-21.668-21.662-50.469-33.589-81.093-33.589s-59.425,11.928-81.093,33.586    L33.602,332.022C11.934,353.69,0,382.494,0,413.128c0,30.637,11.934,59.432,33.605,81.084l49.731,49.73    c21.65,21.668,50.447,33.603,81.081,33.603s59.438-11.935,81.108-33.603l84.083-84.082c2.705-2.705,3.448-6.803,1.869-10.285    c-1.496-3.295-4.776-5.386-8.356-5.386c-0.205,0-0.407,0.007-0.615,0.021c-2.959,0.199-5.958,0.297-8.917,0.297    c-23.354,0-46.322-6.208-66.417-17.956c-1.444-0.844-3.042-1.254-4.629-1.254c-2.375,0-4.725,0.921-6.494,2.689l-53.238,53.238    c-4.902,4.901-11.426,7.604-18.372,7.604c-6.949,0-13.479-2.699-18.381-7.604l-49.734-49.734    c-4.908-4.896-7.61-11.411-7.616-18.348c-0.003-6.953,2.699-13.489,7.616-18.406L245.531,245.532z");
				add_location(path0, file$1, 89, 48, 4829);
				attr_dev(path1, "d", "M543.942,83.324L494.208,33.59C472.556,11.931,443.762,0,413.128,0s-59.438,11.928-81.105,33.587l-84.086,84.119    c-2.705,2.705-3.448,6.806-1.867,10.288c1.497,3.292,4.777,5.382,8.354,5.382c0.205,0,0.413-0.006,0.621-0.021    c2.987-0.202,6.013-0.303,9-0.303c23.4,0,46.316,6.206,66.274,17.947c1.45,0.854,3.057,1.267,4.65,1.267    c2.375,0,4.725-0.921,6.494-2.689l53.274-53.274c4.893-4.896,11.42-7.589,18.375-7.589s13.482,2.696,18.375,7.589l49.734,49.734    c10.123,10.135,10.123,26.634-0.003,36.775L332.017,332.014c-4.894,4.905-11.408,7.604-18.348,7.604    c-6.956,0-13.495-2.702-18.415-7.61l-49.723-49.725c-1.723-1.72-4.057-2.69-6.49-2.69c-2.433,0-4.771,0.967-6.49,2.69    l-49.734,49.734c-3.586,3.586-3.586,9.397,0,12.983l49.734,49.734c21.668,21.668,50.469,33.602,81.093,33.602    c30.625,0,59.426-11.934,81.094-33.602l149.205-149.206c21.668-21.658,33.603-50.462,33.603-81.102S565.61,104.983,543.942,83.324    z");
				add_location(path1, file$1, 90, 48, 5866);
				add_location(g0, file$1, 88, 44, 4777);
				add_location(g1, file$1, 87, 40, 4729);
				attr_dev(svg, "width", "1rem");
				attr_dev(svg, "height", "1rem");
				attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
				attr_dev(svg, "fill", "#000000");
				attr_dev(svg, "version", "1.1");
				attr_dev(svg, "id", "Capa_1");
				attr_dev(svg, "viewBox", "0 0 577.545 577.545");
				attr_dev(svg, "xml:space", "preserve");
				attr_dev(svg, "aria-hidden", "true");
				add_location(svg, file$1, 86, 36, 4467);
				attr_dev(a, "href", /*tool*/ ctx[0].url);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "aria-label", `Official website for ${/*tool*/ ctx[0].name}`);
				add_location(a, file$1, 85, 32, 4344);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a, anchor);
				append_dev(a, svg);
				append_dev(svg, g1);
				append_dev(g1, g0);
				append_dev(g0, path0);
				append_dev(g0, path1);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(a);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(85:28) {:else}",
			ctx
		});

		return block;
	}

	// (78:28) {#if tool.url.includes('github')}
	function create_if_block_1(ctx) {
		let a;
		let svg;
		let path;

		const block = {
			c: function create() {
				a = element("a");
				svg = svg_element("svg");
				path = svg_element("path");
				attr_dev(path, "fill-rule", "evenodd");
				attr_dev(path, "clip-rule", "evenodd");
				attr_dev(path, "d", "M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z");
				attr_dev(path, "transform", "scale(64)");
				attr_dev(path, "fill", "#1B1F23");
				add_location(path, file$1, 81, 36, 3339);
				attr_dev(svg, "width", "1.5rem");
				attr_dev(svg, "height", "1.5rem");
				attr_dev(svg, "viewBox", "0 0 1024 1024");
				attr_dev(svg, "fill", "none");
				attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg, "aria-hidden", "true");
				add_location(svg, file$1, 80, 32, 3176);
				attr_dev(a, "href", /*tool*/ ctx[0].url);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "aria-label", `${/*tool*/ ctx[0].name} on GitHub`);
				add_location(a, file$1, 79, 32, 3068);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a, anchor);
				append_dev(a, svg);
				append_dev(svg, path);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(a);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(78:28) {#if tool.url.includes('github')}",
			ctx
		});

		return block;
	}

	// (72:12) {#each unixTools as tool}
	function create_each_block(ctx) {
		let div1;
		let div0;
		let pre;
		let span;
		let t1_value = /*tool*/ ctx[0].name + "";
		let t1;
		let t2;
		let t3;
		let p;
		let t5;
		let if_block = /*tool*/ ctx[0].url && create_if_block(ctx);

		const block = {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				pre = element("pre");
				span = element("span");
				span.textContent = "$";
				t1 = text(t1_value);
				t2 = space();
				if (if_block) if_block.c();
				t3 = space();
				p = element("p");
				p.textContent = `${/*tool*/ ctx[0].description}`;
				t5 = space();
				attr_dev(span, "class", "select-none mr-2");
				add_location(span, file$1, 74, 29, 2876);
				add_location(pre, file$1, 74, 24, 2871);
				attr_dev(div0, "class", "flex flex-row justify-between items-center");
				add_location(div0, file$1, 73, 20, 2790);
				attr_dev(p, "class", "text-sm pt-1");
				add_location(p, file$1, 100, 20, 7079);
				attr_dev(div1, "class", "bg-stone-200 dark:bg-gray-700 p-4 rounded-md backdrop-blur-sm flex-none bg-opacity-80 dark:bg-opacity-75");
				add_location(div1, file$1, 72, 16, 2651);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				append_dev(div0, pre);
				append_dev(pre, span);
				append_dev(pre, t1);
				append_dev(div0, t2);
				if (if_block) if_block.m(div0, null);
				append_dev(div1, t3);
				append_dev(div1, p);
				append_dev(div1, t5);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				if (if_block) if_block.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(72:12) {#each unixTools as tool}",
			ctx
		});

		return block;
	}

	function create_fragment$1(ctx) {
		let div8;
		let div1;
		let div0;
		let p0;
		let t1;
		let p1;
		let t3;
		let div2;
		let t4;
		let div4;
		let h10;
		let t6;
		let hr0;
		let t7;
		let div3;
		let t8;
		let div7;
		let h11;
		let t10;
		let hr1;
		let t11;
		let div6;
		let div5;
		let p2;
		let t13;
		let ul;
		let li0;
		let t14;
		let kbd0;
		let t16;
		let li1;
		let t17;
		let kbd1;
		let t19;
		let li2;
		let t20;
		let kbd2;
		let t22;
		let li3;
		let t23;
		let kbd3;
		let t25;
		let li4;
		let t26;
		let kbd4;
		let t28;
		let p3;
		let t29;
		let kbd5;
		let t31;
		let each_value_1 = ensure_array_like_dev(tools);
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		let each_value = ensure_array_like_dev(unixTools);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				div8 = element("div");
				div1 = element("div");
				div0 = element("div");
				p0 = element("p");
				p0.textContent = "This is an overview of tools and programs I find useful and use on a daily basis.";
				t1 = space();
				p1 = element("p");
				p1.textContent = "Last updated: 2025-05-14";
				t3 = space();
				div2 = element("div");

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t4 = space();
				div4 = element("div");
				h10 = element("h1");
				h10.textContent = "Unix tools";
				t6 = space();
				hr0 = element("hr");
				t7 = space();
				div3 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t8 = space();
				div7 = element("div");
				h11 = element("h1");
				h11.textContent = "MacOS shortcuts";
				t10 = space();
				hr1 = element("hr");
				t11 = space();
				div6 = element("div");
				div5 = element("div");
				p2 = element("p");
				p2.textContent = "There are some great built-in tools macOS provides. 'Preview' serves as the default application for viewing images, PDF files and many more.\n                    For screen captures, you have multiple options:";
				t13 = space();
				ul = element("ul");
				li0 = element("li");
				t14 = text("Screenshot region to your clipboard: ");
				kbd0 = element("kbd");
				kbd0.textContent = "Cmd+Ctrl+Shift+3";
				t16 = space();
				li1 = element("li");
				t17 = text("Screenshot the entire screen to your clipboard: ");
				kbd1 = element("kbd");
				kbd1.textContent = "Cmd+Ctrl+Shift+4";
				t19 = space();
				li2 = element("li");
				t20 = text("Screenshot a selected region to a file: ");
				kbd2 = element("kbd");
				kbd2.textContent = "Cmd+Shift+3";
				t22 = space();
				li3 = element("li");
				t23 = text("Screenshot the entire screen to a file: ");
				kbd3 = element("kbd");
				kbd3.textContent = "Cmd+Shift+4";
				t25 = space();
				li4 = element("li");
				t26 = text("Open screen capture controls (+video): ");
				kbd4 = element("kbd");
				kbd4.textContent = "Cmd+Shift+5";
				t28 = space();
				p3 = element("p");
				t29 = text("When there's an image in your clipboard, you can use ");
				kbd5 = element("kbd");
				kbd5.textContent = "Cmd+Shift+N";
				t31 = text(" if preview is open to create a new document with the image.");
				add_location(p0, file$1, 40, 12, 1380);
				attr_dev(p1, "class", "text-xs pt-1 text-gray-600 dark:text-gray-400 w-full flex justify-end");
				add_location(p1, file$1, 44, 12, 1512);
				attr_dev(div0, "class", "text-left flex flex-wrap");
				add_location(div0, file$1, 39, 8, 1329);
				attr_dev(div1, "class", "flex justify-start w-full p-4 bg-stone-200 dark:bg-gray-700 p-4 mb-12 rounded-md backdrop-blur-sm bg-opacity-80 dark:bg-opacity-75");
				add_location(div1, file$1, 38, 4, 1176);
				attr_dev(div2, "class", "flex flex-wrap justify-between gap-8");
				add_location(div2, file$1, 50, 4, 1683);
				add_location(h10, file$1, 68, 8, 2509);
				attr_dev(hr0, "class", "mb-4");
				add_location(hr0, file$1, 69, 8, 2537);
				attr_dev(div3, "class", "flex flex-col gap-4");
				add_location(div3, file$1, 70, 8, 2563);
				attr_dev(div4, "class", "my-8");
				add_location(div4, file$1, 67, 4, 2482);
				add_location(h11, file$1, 108, 8, 7228);
				attr_dev(hr1, "class", "mb-4");
				add_location(hr1, file$1, 109, 8, 7261);
				attr_dev(p2, "class", "mb-4");
				add_location(p2, file$1, 112, 16, 7484);
				add_location(kbd0, file$1, 117, 61, 7886);
				add_location(li0, file$1, 117, 20, 7845);
				add_location(kbd1, file$1, 118, 72, 7991);
				add_location(li1, file$1, 118, 20, 7939);
				add_location(kbd2, file$1, 119, 64, 8088);
				add_location(li2, file$1, 119, 20, 8044);
				add_location(kbd3, file$1, 120, 64, 8180);
				add_location(li3, file$1, 120, 20, 8136);
				add_location(kbd4, file$1, 121, 63, 8271);
				add_location(li4, file$1, 121, 20, 8228);
				attr_dev(ul, "class", "list-disc list-inside pl-4 text-sm space-y-1");
				add_location(ul, file$1, 116, 16, 7767);
				add_location(kbd5, file$1, 124, 73, 8427);
				attr_dev(p3, "class", "my-4");
				add_location(p3, file$1, 123, 16, 8337);
				attr_dev(div5, "class", "text-left");
				add_location(div5, file$1, 111, 12, 7444);
				attr_dev(div6, "class", "flex justify-start w-full p-4 bg-stone-200 dark:bg-gray-700 p-4 mb-12 rounded-md backdrop-blur-sm bg-opacity-80 dark:bg-opacity-75");
				add_location(div6, file$1, 110, 8, 7287);
				attr_dev(div7, "class", "my-8");
				add_location(div7, file$1, 107, 4, 7201);
				add_location(div8, file$1, 37, 0, 1166);
			},
			l: function claim(nodes) {
				throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div8, anchor);
				append_dev(div8, div1);
				append_dev(div1, div0);
				append_dev(div0, p0);
				append_dev(div0, t1);
				append_dev(div0, p1);
				append_dev(div8, t3);
				append_dev(div8, div2);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(div2, null);
					}
				}

				append_dev(div8, t4);
				append_dev(div8, div4);
				append_dev(div4, h10);
				append_dev(div4, t6);
				append_dev(div4, hr0);
				append_dev(div4, t7);
				append_dev(div4, div3);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div3, null);
					}
				}

				append_dev(div8, t8);
				append_dev(div8, div7);
				append_dev(div7, h11);
				append_dev(div7, t10);
				append_dev(div7, hr1);
				append_dev(div7, t11);
				append_dev(div7, div6);
				append_dev(div6, div5);
				append_dev(div5, p2);
				append_dev(div5, t13);
				append_dev(div5, ul);
				append_dev(ul, li0);
				append_dev(li0, t14);
				append_dev(li0, kbd0);
				append_dev(ul, t16);
				append_dev(ul, li1);
				append_dev(li1, t17);
				append_dev(li1, kbd1);
				append_dev(ul, t19);
				append_dev(ul, li2);
				append_dev(li2, t20);
				append_dev(li2, kbd2);
				append_dev(ul, t22);
				append_dev(ul, li3);
				append_dev(li3, t23);
				append_dev(li3, kbd3);
				append_dev(ul, t25);
				append_dev(ul, li4);
				append_dev(li4, t26);
				append_dev(li4, kbd4);
				append_dev(div5, t28);
				append_dev(div5, p3);
				append_dev(p3, t29);
				append_dev(p3, kbd5);
				append_dev(p3, t31);
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*getIcon, adaptSvgString, iconSize*/ 0) {
					each_value_1 = ensure_array_like_dev(tools);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_1(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(div2, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_1.length;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div8);
				}

				destroy_each(each_blocks_1, detaching);
				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	const iconSize = '5em';

	async function getIcon(iconUrl) {
		const response = await fetch(iconUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch SVG: ${response.statusText}`);
		}

		const svgText = await response.text();
		return svgText;
	}

	// Adapt the SVG string to the desired size
	function adaptSvgString(svgString, width, height) {
		if (!svgString || typeof svgString !== 'string') {
			return '';
		}

		let modifiedSvg = svgString.replace(/<svg([^>]*)>/i, (match, attributes) => {
			let cleanedAttributes = attributes.replace(/\\s*width\\s*=\\s*["']?[^"'\s>]*["']?/gi, '').replace(/\\s*height\\s*=\\s*["']?[^"'\s>]*["']?/gi, '');

			const attributesPart = cleanedAttributes.trim()
			? ` ${cleanedAttributes.trim()}`
			: '';

			return `<svg width="${width}" height="${height}" aria-hidden="true"${attributesPart}>`;
		});

		return modifiedSvg;
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Tools', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tools> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			tools,
			unixTools,
			iconSize,
			getIcon,
			adaptSvgString
		});

		return [];
	}

	class Tools extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Tools",
				options,
				id: create_fragment$1.name
			});
		}
	}

	/* src/App.svelte generated by Svelte v4.2.20 */
	const file = "src/App.svelte";

	function create_fragment(ctx) {
		let div2;
		let menu;
		let t0;
		let div1;
		let main;
		let router;
		let t1;
		let div0;
		let particles;
		let current;
		menu = new Menu({ $$inline: true });

		router = new Router({
				props: {
					routes: {
						'/': Home,
						'/skills': SkillsPage,
						'/experience': Experience,
						'/education': Education,
						'/blog/:slug': Article,
						'/blog': BlogIndex,
						'/canvas': CanvasVisuals,
						'/tools': Tools
					}
				},
				$$inline: true
			});

		particles = new Particles({
				props: { class: "h-full border-1" },
				$$inline: true
			});

		const block = {
			c: function create() {
				div2 = element("div");
				create_component(menu.$$.fragment);
				t0 = space();
				div1 = element("div");
				main = element("main");
				create_component(router.$$.fragment);
				t1 = space();
				div0 = element("div");
				create_component(particles.$$.fragment);
				attr_dev(main, "class", "p-6 pt-12 w-full sm:w-2/3 dark:text-white svelte-122gec8");
				add_location(main, file, 20, 2, 848);
				attr_dev(div0, "class", "particle-background max-h-screen svelte-122gec8");
				toggle_class(div0, "fade-in", /*$particlesEnabled*/ ctx[0]);
				toggle_class(div0, "fade-out", !/*$particlesEnabled*/ ctx[0]);
				add_location(div0, file, 33, 2, 1149);
				attr_dev(div1, "class", "wrapper flex flex-col flex-grow items-center svelte-122gec8");
				add_location(div1, file, 19, 1, 787);
				attr_dev(div2, "class", "flex flex-col h-full");
				add_location(div2, file, 17, 0, 736);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				mount_component(menu, div2, null);
				append_dev(div2, t0);
				append_dev(div2, div1);
				append_dev(div1, main);
				mount_component(router, main, null);
				append_dev(div1, t1);
				append_dev(div1, div0);
				mount_component(particles, div0, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (!current || dirty & /*$particlesEnabled*/ 1) {
					toggle_class(div0, "fade-in", /*$particlesEnabled*/ ctx[0]);
				}

				if (!current || dirty & /*$particlesEnabled*/ 1) {
					toggle_class(div0, "fade-out", !/*$particlesEnabled*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(menu.$$.fragment, local);
				transition_in(router.$$.fragment, local);
				transition_in(particles.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(menu.$$.fragment, local);
				transition_out(router.$$.fragment, local);
				transition_out(particles.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div2);
				}

				destroy_component(menu);
				destroy_component(router);
				destroy_component(particles);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance($$self, $$props, $$invalidate) {
		let $particlesEnabled;
		validate_store(particlesEnabled, 'particlesEnabled');
		component_subscribe($$self, particlesEnabled, $$value => $$invalidate(0, $particlesEnabled = $$value));
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		darkMode.subscribe(enabled => document.documentElement.classList.toggle('dark', enabled));
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			Router,
			location,
			link,
			Particles,
			darkMode,
			particlesEnabled,
			Menu,
			Home,
			Experience,
			Skills: SkillsPage,
			Education,
			BlogIndex,
			Article,
			CanvasVisualis: CanvasVisuals,
			Tools,
			$particlesEnabled
		});

		return [$particlesEnabled];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	const app = new App({
		target: document.body
	});

	return app;

})();
//# sourceMappingURL=bundle.js.map
