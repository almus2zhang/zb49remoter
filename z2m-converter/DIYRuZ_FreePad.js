const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');
const genMultistateInputClusterId = 18;

const getKey = (object, value) => {
    for (const key in object) {
        if (object[key] == value) return key;
    }
};
const bind = async (endpoint, target, clusters) => {
    for (const cluster of clusters) {
        await endpoint.bind(cluster, target);
    }
};

const fz = {
    diyruz_freepad_clicks: {
        cluster: 'genMultistateInput',
        type: ['readResponse', 'attributeReport'],
        convert: (model, msg, publish, options, meta) => {
            const button = getKey(model.endpoint(msg.device), msg.endpoint.ID);
            const lookup = {
                0: 'hold',
                1: 'single',
                2: 'double',
                3: 'triple',
                4: 'quadruple',
                255: 'release',
            };
            const clicks = msg.data['presentValue'];
            const action = lookup[clicks] ? lookup[clicks] : `many_${clicks}`;
            return {
                action: `${button}_${action}`,
            };
        },
    },
};

const tz = {
    diyruz_freepad_on_off_config: {
        key: ['switch_type', 'switch_actions'],
        convertSet: async (entity, key, value, meta) => {
            const switchTypesLookup = {
                toggle: 0x00,
                momentary: 0x01,
                multifunction: 0x02,
            };
            const switchActionsLookup = {
                on: 0x00,
                off: 0x01,
                toggle: 0x02,
            };
            const intVal = parseInt(value, 10);
            const switchType = switchTypesLookup.hasOwnProperty(value) ? switchTypesLookup[value] : intVal;
            const switchActions = switchActionsLookup.hasOwnProperty(value) ? switchActionsLookup[value] : intVal;

            const payloads = {
                switch_type: {
                    switchType,
                },
                switch_actions: {
                    switchActions,
                },
            };

            await entity.write('genOnOffSwitchCfg', payloads[key]);
        },
    },
};

const device = {
    zigbeeModel: ['DIYRuZ_FreePad'],
    model: 'DIYRuZ_FreePad',
    vendor: 'DIYRuZ',
    description: '[DiY 8/12/20 button keypad](http://modkam.ru/?p=1114)',
    supports: 'single, double, triple, quadruple, many, hold/release',
    fromZigbee: [fz.diyruz_freepad_clicks, zigbeeHerdsmanConverters.fromZigbeeConverters.battery],
    toZigbee: [tz.diyruz_freepad_on_off_config, zigbeeHerdsmanConverters.toZigbeeConverters.factory_reset],
    meta: {
        configureKey: 1,
    },
    configure: async (device, coordinatorEndpoint) => {
        const endpoint = device.getEndpoint(1);
        await bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
        if (device.applicationVersion < 3) { //Legacy PM2 firmwares
            const payload = [{
                attribute: 'batteryPercentageRemaining',
                minimumReportInterval: 0,
                maximumReportInterval: 3600,
                reportableChange: 0,
            }, {
                attribute: 'batteryVoltage',
                minimumReportInterval: 0,
                maximumReportInterval: 3600,
                reportableChange: 0,
            }];
            await endpoint.configureReporting('genPowerCfg', payload);
        }


        device.endpoints.forEach(async (ep) => {
            if (ep.outputClusters.includes(genMultistateInputClusterId)) {
                await bind(ep, coordinatorEndpoint, ['genMultistateInput']);
            }
        });
    },
    endpoint: (device) => {
        return {
            button_1: 1,
            button_2: 2,
            button_3: 3,
            button_4: 4,
            button_5: 5,
            button_6: 6,
            button_7: 7,
            button_8: 8,
            button_9: 9,
            button_10: 10,
            button_11: 11,
            button_12: 12,
            button_13: 13,
            button_14: 14,
            button_15: 15,
            button_16: 16,
            button_17: 17,
            button_18: 18,
            button_19: 19,
            button_20: 20,
        };
    },
};

module.exports = device;