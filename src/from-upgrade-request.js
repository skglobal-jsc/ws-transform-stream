'use strict';

const PerMessageDeflate = require('ws/lib/permessage-deflate');
const WsExtensions = require('ws/lib/extension');

const WsTransformStream = require('./ws-transform-stream');

const DEFLATE_EXT_NAME = PerMessageDeflate.extensionName;

function getHeader(source, name) {
    if (!source || typeof source !== 'object')
        return;

    if (source && typeof source.getHeader == 'function')
        return source.getHeader(name) || source.getHeader(name.toLowerCase());

    if (source && typeof source.get == 'function')
        return source.get(name) || source.get(name.toLowerCase());

    return source[name] || source[name.toLowerCase()];
}

function fromUpdgradeHeaders(reqs, options = {}) {
    options.receiver = options.receiver || {};
    options.sender = options.sender || {};

    for (const iterator of ['receiver', 'sender']) {
        try {
            if (!reqs[iterator])
                continue
            options.compress = true;

            const extHeader = getHeader(reqs[iterator], 'Sec-Websocket-Extensions');
            const extensions = extHeader && WsExtensions.parse(extHeader);

            // they want to enable PerMessageDeflate
            if (extensions[DEFLATE_EXT_NAME]) {
                options[iterator].extensions = options[iterator].extensions || {};

                options[iterator].extensions[DEFLATE_EXT_NAME] =
                    new PerMessageDeflate({}, true, options[iterator].maxPayload);
                options[iterator].extensions[DEFLATE_EXT_NAME]
                    .accept(extensions[DEFLATE_EXT_NAME]);
            }
        } catch (err) {
            // silently fail, server/client will handle the errors in negotiation

            if (options[iterator] && options[iterator].extensions)
                delete options[iterator].extensions[DEFLATE_EXT_NAME];
        }
    }

    return new WsTransformStream(options);
}

module.exports = fromUpdgradeHeaders;
