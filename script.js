String.prototype.toTitleCase = function () {
  return this.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

String.prototype.hyphenated = function () {
  return this.replace(/ /g, "-");
};
String.prototype.unhyphenated = function () {
  return this.replace(/-/g, " ");
};

Array.fromRange = (length, func = null) =>
  new Array(length)
    .fill(null)
    .map((value, index, array) => (func ? func(index, array) : index));

$.fn.getId = function () {
  return this.get(0)?.id;
};

$.fn.forEach = function (func) {
  return this.each((index, element) => func($(element), index));
};

function assert(expr, msg) {
  if (!expr) throw msg;
}

function createReverseMapping(object) {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [value, key])
  );
}

let _enumCounter = 0;
function makeEnumObj(...keys) {
  const entries = keys.map((key) => [key.toUpperCase(), _enumCounter++]);
  const enumObj = Object.fromEntries(entries);
  const reverseObj = createReverseMapping(enumObj);
  enumObj.keys = () => entries.map(([key, value]) => key);
  enumObj.values = () => entries.map(([key, value]) => value);
  enumObj.fromValue = (value) => reverseObj[value];
  enumObj.createMapping = (func) => {
    const obj = Object.fromEntries(
      entries.map(([key, value]) => [value, func(key)])
    );
    const reverseMappingObj = createReverseMapping(obj);
    obj.fromValue = (value) => Number(reverseMappingObj[value]);
    return obj;
  };
  return Object.freeze(enumObj);
}

function parseInteger(numStr) {
  numStr = numStr.trim();
  const errorMsg = `Invalid integer: ${numStr}`;
  assert(!isNaN(numStr), errorMsg);
  const num = Number(numStr);
  assert(Number.isInteger(num), errorMsg);
  return num;
}

/**
 * Helper functions for creating Bootstrap elements.
 * @namespace
 */
const BootstrapHtml = {
  icon: function (icon) {
    return $("<i>", { class: `bi bi-${icon}` });
  },
  _inputCounter: 0,
  input: function ({
    type = "text",
    id = null,
    inputClass = null,
    value = null,
    validation = false,
    ...attrs
  } = {}) {
    attrs.type = type;
    attrs.id = id ?? `input${this._inputCounter++}`;
    const classes = ["form-control"];
    if (inputClass != null) {
      classes.push(inputClass);
    }
    attrs.class = classes.join(" ");
    if (value != null) {
      attrs.value = value;
    }
    const $input = $("<input>", attrs);
    if (!validation) return $input;
    return $("<div>").append(
      $input,
      $("<div>", { id: `${attrs.id}-feedback`, class: "invalid-feedback" })
    );
  },
  buttonGroup: function (
    $elements,
    {
      id = null,
      divClass = null,
      small = false,
      vertical = false,
      ...attrs
    } = {}
  ) {
    // group div attrs
    if (id != null) {
      attrs.id = id;
    }
    const classes = [];
    if (vertical) {
      classes.push("btn-group-vertical");
    } else {
      classes.push("btn-group");
    }
    if (small) {
      classes.push("btn-group-sm");
    }
    if (divClass != null) {
      classes.push(divClass);
    }
    if (classes.length > 0) {
      attrs.class = classes.join(" ");
    }
    attrs.role = "group";

    return $("<div>", attrs).append($elements);
  },
  radioButtonGroup: function (
    name,
    elements,
    {
      onlyValues = false,
      elementClass = null,
      elementAccent = null,
      ...groupDivAttrs
    } = {}
  ) {
    // classes for each input
    const elementClasses = ["btn-check"];
    if (elementClass != null) {
      elementClasses.push(elementClass);
    }
    const inputClass = elementClasses.join(" ");

    function addButton(
      {
        id = null,
        value = null,
        attrs = null,
        checked = false,
        accent = null,
        content = null,
      },
      index
    ) {
      let elementId;
      if (id != null) {
        elementId = id;
      } else if (value != null) {
        elementId = `${name}-${String(value).hyphenated()}`;
      } else {
        elementId = `${name}-${index}`;
      }
      return [
        $("<input>", {
          type: "radio",
          id: elementId,
          name: name,
          class: inputClass,
          value: value,
          autocomplete: "off",
          checked: checked,
          ...attrs,
        }),
        $("<label>", {
          id: `${elementId}-label`,
          for: elementId,
          class: `btn btn-outline-${accent ?? elementAccent}`,
        }).append(content ?? value),
      ];
    }

    return this.buttonGroup(
      elements.flatMap((options, index) =>
        addButton(onlyValues ? { value: options } : options, index)
      ),
      groupDivAttrs
    );
  },
  dropdown: function (
    elements,
    {
      id = null,
      dropdownClass = null,
      defaultBlank = true,
      disableDefault = true,
      deleteDefault = true,
      onlyLabels = false,
      ...attrs
    } = {}
  ) {
    if (!disableDefault) deleteDefault = false;

    // select attrs
    if (id != null) {
      attrs.id = id;
    }
    const classes = ["form-select"];
    if (dropdownClass != null) {
      classes.push(dropdownClass);
    }
    attrs.class = classes.join(" ");

    // select the first element with `selected = true`
    let hasSelected = false;
    for (const option of elements) {
      if (option.isGroup) {
        for (const suboption of option.elements ?? []) {
          if (suboption.selected) {
            if (hasSelected) {
              suboption.selected = false;
            } else {
              hasSelected = true;
            }
          }
        }
        continue;
      }
      if (option.selected) {
        if (hasSelected) {
          option.selected = false;
        } else {
          hasSelected = true;
        }
      }
    }

    function addOption({
      value = null,
      label,
      selected = false,
      disabled = false,
    }) {
      return $("<option>", { value: value ?? label, selected, disabled }).text(
        label
      );
    }

    const defaultOption =
      defaultBlank && !hasSelected
        ? $("<option>", {
            value: "",
            disabled: disableDefault,
            selected: true,
            default: true,
          }).text("-")
        : null;

    const $select = $("<select>", attrs);
    let groupIndex = 0;
    $select.append(
      defaultOption,
      elements.map((options) => {
        if (onlyLabels) {
          return addOption({ label: options });
        }
        if (options.isGroup) {
          const groupOptions = options;
          const groupOnlyLabels = groupOptions.onlyLabels ?? false;
          groupIndex++;
          return $("<optgroup>", {
            label: groupOptions.label ?? `Group ${groupIndex}`,
          }).append(
            (groupOptions.elements ?? []).map((options) =>
              addOption(groupOnlyLabels ? { label: options } : options)
            )
          );
        }
        return addOption(onlyLabels ? { label: options } : options);
      })
    );

    if (defaultBlank && deleteDefault) {
      $select.one("change", (event) => {
        // delete the first default option the first time an option is selected
        $select.children("[default]:disabled").forEach(($option) => {
          if ($option.text().trim() === "-") {
            $option.remove();
            return false;
          }
        });
      });
    }

    return $select;
  },
};

const ObjectType = makeEnumObj(
  "ASTEROID",
  "COMET",
  "DWARF_PLANET",
  "GAS_CLOUD",
  "PLANET_X",
  "TRULY_EMPTY"
);
const ObjectCode = Object.freeze(
  ObjectType.createMapping((object) => object.replace(/_/g, "-").toLowerCase())
);
const ObjectName = Object.freeze(
  ObjectType.createMapping((object) => object.replace(/_/g, " ").toTitleCase())
);
const objectDropdownOptions = ObjectType.values().map((object) => ({
  value: ObjectCode[object],
  label: ObjectName[object],
}));

class SectorRule {
  static Type = makeEnumObj("SURVEY", "TARGET");
  static TypeCode = Object.freeze(
    SectorRule.Type.createMapping((ruleType) => ruleType.toLowerCase())
  );

  static _ruleCounter = 0;

  kind = "sector";
  constructor(type, object, args) {
    this.id = SectorRule._ruleCounter++;

    /**
     * The type of rule.
     * @type {!SectorRule.Type}
     */
    this.type = type;

    /**
     * The object this rule applies to.
     * @type {!ObjectType}
     */
    this.object = object;

    let requiredArgs;
    if (this.type === SectorRule.Type.SURVEY) {
      requiredArgs = ["startSector", "endSector", "numObjects"];
    } else if (this.type === SectorRule.Type.TARGET) {
      requiredArgs = ["not", "sector"];
    } else {
      assert(false, `Invalid type: ${this.type}`);
    }

    /** The rule args. */
    this.args = Object.fromEntries(
      requiredArgs.map((key) => {
        const value = args[key];
        assert(value != null, `Missing arg "${key}"`);
        return [key, value];
      })
    );
  }

  toString() {
    return JSON.stringify([
      SectorRule.TypeCode[this.type],
      ObjectCode[this.object],
      this.args,
    ]);
  }

  createFinishedRule({ allowDelete = false } = {}) {
    let argsElements;
    if (this.type === SectorRule.Type.SURVEY) {
      argsElements = [
        "Sector ",
        $("<span>", { class: "rule-arg" }).text(this.args.startSector),
        " to ",
        $("<span>", { class: "rule-arg" }).text(this.args.endSector),
        " has ",
        $("<span>", { class: "rule-arg" }).text(this.args.numObjects),
        $("<span>", { class: "rule-arg" }).text(ObjectName[this.object]),
      ];
    } else if (this.type === SectorRule.Type.TARGET) {
      argsElements = [
        "Sector ",
        $("<span>", { class: "rule-arg" }).text(this.args.sector),
        " is ",
        this.args.not ? " not " : null,
        $("<span>", { class: "rule-arg" }).text(ObjectName[this.object]),
      ];
    }
    return $("<div>", { class: "row gx-2 flex-nowrap text-nowrap" }).append(
      $("<div>", { class: "col" }).append(
        allowDelete
          ? // a tiny delete button
            $("<button>", {
              type: "button",
              class: "btn btn-sm btn-outline-danger py-0 px-1 me-1",
            })
              .append(BootstrapHtml.icon("x-lg"))
              .on("click", (event) => {
                // remove the row
                $(`#sector-rule-${this.id}`).remove();
                // delete the rule from the saved rules
                const index = sectorRules.findIndex(
                  (rule) => rule.id === this.id
                );
                if (index !== -1) {
                  sectorRules.splice(index, 1);
                }
                // update
                handleRuleChange();
              })
          : null,
        argsElements
      )
    );
  }

  check(objects) {
    switch (this.type) {
      case SectorRule.Type.SURVEY: {
        const object = this.object;
        const { startSector, endSector, numObjects } = this.args;
        let count = 0;
        let i = startSector - 1;
        while (true) {
          if (objects[i] === object) count++;
          if (i === endSector - 1) break;
          i = (i + 1) % objects.length;
        }
        return count === numObjects;
      }
      case SectorRule.Type.TARGET: {
        const object = this.object;
        const { not, sector } = this.args;
        return (objects[sector - 1] === object) !== not;
      }
    }
    return false;
  }
}

class ObjectRule {
  static Type = makeEnumObj(
    "IN_SECTORS",
    "IN_BAND",
    "ADJACENT_TO",
    "WITHIN_NUM_SECTORS",
    "OPPOSITE"
  );
  static TypeCode = Object.freeze(
    ObjectRule.Type.createMapping((ruleType) =>
      ruleType.replace(/_/g, "-").toLowerCase()
    )
  );

  static RULE_ARGS = (() => {
    function createArg(prefix, settings, argName) {
      const argSettings = settings.args[argName];
      assert(argSettings != null, `arg "${argName}" not found`);
      const inputId = `${prefix}-${argName}`;
      const $arg = argSettings.create(inputId);
      $arg.on("input", (event) => {
        const $input = $(`#${inputId}`);
        $input.removeClass("is-invalid");
        let value = $input.val();
        try {
          if (argSettings.transform) {
            value = argSettings.transform(value);
          }
          argSettings.validate?.(value);
        } catch (error) {
          $(`#${inputId}-feedback`).text(error);
          $input.addClass("is-invalid");
        }
      });
      if (argSettings.reset) {
        $arg.on("reset", (event) => {
          const $input = $(`#${inputId}`);
          argSettings.reset($input);
        });
      }
      return $arg;
    }

    const _posIntArg = {
      create: (id) => {
        return BootstrapHtml.input({
          type: "number",
          id,
          value: 1,
          min: 1,
          step: 1,
          validation: true,
        });
      },
      reset: ($input) => {
        $input.val(1);
      },
      transform: (value) => {
        return parseInteger(value);
      },
      validate: (value) => {
        assert(value > 0, "Integer must be positive");
      },
    };

    const _objArg = {
      create: (id) => {
        return BootstrapHtml.dropdown(objectDropdownOptions, {
          id,
          deleteDefault: false,
        });
      },
      reset: ($input) => {
        $input.val("");
      },
      transform: ObjectCode.fromValue,
      display: (value) => {
        return ObjectName[value];
      },
    };

    return Object.freeze({
      createRule: function (ruleType) {
        const arg = this[ruleType];
        const ruleTypeCode = ObjectRule.TypeCode[ruleType];
        return arg.display.slice(1).map((segment) => {
          if (segment.arg != null) {
            return createArg(ruleTypeCode, arg, segment.arg);
          }
          return segment;
        });
      },
      displayArg: (ruleArgs, argName, value) => {
        const arg = ruleArgs.args[argName];
        if (arg.display != null) value = arg.display(value);
        return value;
      },
      [ObjectRule.Type.IN_SECTORS]: {
        display: ["in sectors", { arg: "sectors" }],
        args: {
          sectors: {
            create: (id) => {
              return BootstrapHtml.input({
                id,
                placeholder: "Sectors",
                validation: true,
              });
            },
            reset: ($input) => {
              $input.val("");
            },
            transform: (value) => {
              value = value.trim();
              if (value === "") return [];
              return [
                ...new Set(
                  value.split(",").map((numStr) => parseInteger(numStr))
                ),
              ].sort((a, b) => a - b);
            },
            validate: (value) => {
              assert(Array.isArray(value), "Sectors must be an array");
              assert(value.length > 0, "At least one sector is required");
            },
            display: (value) => {
              return value.join(", ");
            },
          },
        },
      },
      [ObjectRule.Type.IN_BAND]: {
        display: [
          "in band of",
          { arg: "exactly" },
          { arg: "length" },
          "sectors",
        ],
        args: {
          exactly: {
            create: (id) => {
              return BootstrapHtml.radioButtonGroup(
                `${id}-upper-limit`,
                [
                  { value: "exactly", content: "exactly", checked: true },
                  { value: "at-most", content: "at most" },
                ],
                { id, elementAccent: "primary" }
              );
            },
            reset: ($input) => {
              const id = $input.getId();
              $(`#${id}-upper-limit-exactly`).prop("checked", true);
            },
            transform: (value) => {
              return value === "exactly";
            },
            display: (value) => {
              return value ? "exactly" : "at most";
            },
          },
          length: _posIntArg,
        },
      },
      [ObjectRule.Type.ADJACENT_TO]: {
        display: ["adjacent to", { arg: "object" }],
        args: {
          object: _objArg,
        },
      },
      [ObjectRule.Type.WITHIN_NUM_SECTORS]: {
        display: [
          "within",
          { arg: "numSectors" },
          "sectors of",
          { arg: "object" },
        ],
        args: {
          numSectors: _posIntArg,
          object: _objArg,
        },
      },
      [ObjectRule.Type.OPPOSITE]: {
        display: ["opposite of", { arg: "object" }],
        args: {
          object: _objArg,
        },
      },
    });
  })();

  static _ruleCounter = 0;

  kind = "object";
  constructor(object, type, { atLeastOne = false, not = false, ...args }) {
    this.id = ObjectRule._ruleCounter++;

    /**
     * The object this rule applies to.
     * @type {!ObjectType}
     */
    this.object = object;

    /**
     * The type of rule.
     * @type {!ObjectRule.Type}
     */
    this.type = type;

    /**
     * Whether this rule applies to at least one object of a specified type or
     * to all objects of that type.
     *
     * Example: "At least one asteroid is..."
     * @type {boolean}
     */
    this.atLeastOne = atLeastOne;

    /**
     * Whether this rule should be negated.
     *
     * Example: "Planet X is not adjacent to a Dwarf Planet."
     * @type {boolean}
     */
    this.not = not;

    if (this.type === ObjectRule.Type.IN_BAND) {
      this.atLeastOne = false;
      this.not = false;
    }

    /** The rule args. */
    this.args = Object.fromEntries(
      Object.keys(ObjectRule.RULE_ARGS[this.type].args).map((key) => {
        const value = args[key];
        assert(value != null, `Missing arg "${key}"`);
        return [key, value];
      })
    );
  }

  toString() {
    const args = { atLeastOne: this.atLeastOne, not: this.not, ...this.args };
    if (args.object != null) {
      args.object = ObjectCode[args.object];
    }
    return JSON.stringify([
      ObjectCode[this.object],
      ObjectRule.TypeCode[this.type],
      args,
    ]);
  }

  createFinishedRule({ allowDelete = false } = {}) {
    function createArgValue(arg, display = null) {
      if (display != null) arg = display(arg);
      return $("<span>", { class: "rule-arg" }).text(arg);
    }
    const ruleArgs = ObjectRule.RULE_ARGS[this.type];
    return $("<div>", { class: "row gx-2 flex-nowrap text-nowrap" }).append(
      $("<div>", { class: "col" }).append(
        allowDelete
          ? // a tiny delete button
            $("<button>", {
              type: "button",
              class: "btn btn-sm btn-outline-danger py-0 px-1 me-1",
            })
              .append(BootstrapHtml.icon("x-lg"))
              .on("click", (event) => {
                // remove the row
                $(`#object-rule-${this.id}`).remove();
                // delete the rule from the saved rules
                const index = objectRules.findIndex(
                  (rule) => rule.id === this.id
                );
                if (index !== -1) {
                  objectRules.splice(index, 1);
                }
                // update
                handleRuleChange();
              })
          : null,
        this.atLeastOne ? "At least one " : "",
        createArgValue(ObjectName[this.object]),
        " is ",
        this.not ? " not " : "",
        ...ruleArgs.display.map((segment) => {
          if (segment.arg != null) {
            const argName = segment.arg;
            return createArgValue(
              ObjectRule.RULE_ARGS.displayArg(
                ruleArgs,
                argName,
                this.args[argName]
              )
            );
          }
          return ` ${segment} `;
        })
      )
    );
  }

  check(objects) {
    let isValid = null;
    switch (this.type) {
      case ObjectRule.Type.IN_SECTORS: {
        const { sectors } = this.args;
        const sectorsSet = new Set(sectors);
        isValid = (i) => sectorsSet.has(i + 1);
        break;
      }
      case ObjectRule.Type.IN_BAND: {
        // NOTE: does not use `atLeastOne` or `not`
        // each instance of this object must be in a band
        const { exactly, length } = this.args;
        // i didn't want to do all the weird edge cases with wraparound so just
        // gonna check all the possible bands of this length
        const indices = objects.flatMap((object, index) =>
          object === this.object ? [index] : []
        );
        for (let start = 0; start < objects.length; start++) {
          if (exactly) {
            // band must start and end with the object
            const end = (start + length - 1) % objects.length;
            if (![start, end].every((index) => objects[index] === this.object))
              continue;
          }
          const band = new Set(
            Array.fromRange(length, (index) => (start + index) % objects.length)
          );
          // object cannot be in positions outside of band
          if (!indices.every((index) => band.has(index))) {
            continue;
          }
          return true;
        }
        return false;
      }
      case ObjectRule.Type.ADJACENT_TO: {
        const { object: adjObject } = this.args;
        isValid = (i) => {
          const left = (i > 0 ? i : objects.length) - 1;
          if (objects[left] === adjObject) return true;
          const right = (i + 1) % objects.length;
          if (objects[right] === adjObject) return true;
          return false;
        };
        break;
      }
      case ObjectRule.Type.WITHIN_NUM_SECTORS: {
        const { numSectors, object: nearObject } = this.args;
        isValid = (i) => {
          for (let j = 1; j <= numSectors; j++) {
            const left = (i - j + objects.length) % objects.length;
            if (objects[left] === nearObject) return true;
            const right = (i + j) % objects.length;
            if (objects[right] === nearObject) return true;
          }
          return false;
        };
        break;
      }
      case ObjectRule.Type.OPPOSITE: {
        const { object: oppObject } = this.args;
        isValid = (i) => {
          const oppIndex = (i + objects.length / 2) % objects.length;
          return objects[oppIndex] === oppObject;
        };
        break;
      }
    }
    if (isValid != null) {
      if (this.atLeastOne === this.not) {
        // at least one is not OR all
        return (
          objects.every(
            (obj, index) => obj !== this.object || isValid(index)
          ) !== this.not
        );
      } else {
        // at least one OR all are not
        return (
          objects.some(
            (obj, index) => obj === this.object && isValid(index)
          ) !== this.not
        );
      }
    }
    return false;
  }
}

const MODE_SETTINGS = {
  standard: {
    accent: "primary",
    counts: {
      [ObjectType.ASTEROID]: 4,
      [ObjectType.COMET]: 2,
      [ObjectType.DWARF_PLANET]: 1,
      [ObjectType.GAS_CLOUD]: 2,
      [ObjectType.PLANET_X]: 1,
      [ObjectType.TRULY_EMPTY]: 2,
    },
    defaultRules: [
      new ObjectRule(ObjectType.ASTEROID, ObjectRule.Type.ADJACENT_TO, {
        object: ObjectType.ASTEROID,
      }),
      new ObjectRule(ObjectType.COMET, ObjectRule.Type.IN_SECTORS, {
        sectors: [2, 3, 5, 7, 11],
      }),
      new ObjectRule(ObjectType.DWARF_PLANET, ObjectRule.Type.ADJACENT_TO, {
        not: true,
        object: ObjectType.PLANET_X,
      }),
      new ObjectRule(ObjectType.GAS_CLOUD, ObjectRule.Type.ADJACENT_TO, {
        object: ObjectType.TRULY_EMPTY,
      }),
      new ObjectRule(ObjectType.PLANET_X, ObjectRule.Type.ADJACENT_TO, {
        not: true,
        object: ObjectType.DWARF_PLANET,
      }),
    ],
  },
  expert: {
    accent: "danger",
    counts: {
      [ObjectType.ASTEROID]: 4,
      [ObjectType.COMET]: 2,
      [ObjectType.DWARF_PLANET]: 4,
      [ObjectType.GAS_CLOUD]: 2,
      [ObjectType.PLANET_X]: 1,
      [ObjectType.TRULY_EMPTY]: 5,
    },
    defaultRules: [
      new ObjectRule(ObjectType.ASTEROID, ObjectRule.Type.ADJACENT_TO, {
        object: ObjectType.ASTEROID,
      }),
      new ObjectRule(ObjectType.COMET, ObjectRule.Type.IN_SECTORS, {
        sectors: [2, 3, 5, 7, 11, 13, 17],
      }),
      new ObjectRule(ObjectType.DWARF_PLANET, ObjectRule.Type.ADJACENT_TO, {
        not: true,
        object: ObjectType.PLANET_X,
      }),
      new ObjectRule(ObjectType.DWARF_PLANET, ObjectRule.Type.IN_BAND, {
        exactly: true,
        length: 6,
      }),
      new ObjectRule(ObjectType.GAS_CLOUD, ObjectRule.Type.ADJACENT_TO, {
        object: ObjectType.TRULY_EMPTY,
      }),
      new ObjectRule(ObjectType.PLANET_X, ObjectRule.Type.ADJACENT_TO, {
        not: true,
        object: ObjectType.DWARF_PLANET,
      }),
    ],
  },
};

function getSelected(selector) {
  let selected = null;
  $(selector).forEach(($input) => {
    if ($input.prop("disabled")) return;
    if ($input.prop("checked")) {
      selected = $input.val();
      return false;
    }
  });
  return selected;
}

const sectorRules = [];
const objectRules = [];

/**
 * Yields all unique permutations of the input array of objects.
 *
 * Also tries to prune branches using the given rules.
 *
 * https://www.geeksforgeeks.org/print-all-possible-permutations-of-an-array-with-duplicates-using-backtracking/
 * @param {!Array<number>} array
 * @param {!Array<SectorRule|ObjectRule>} allRules
 */
function* yieldGalaxies(counts, allRules = null) {
  const array = Object.entries(counts)
    // since they're entries, the objects will actually be strings
    .map(([obj, count]) => [Number(obj), count])
    .sort(([obj1, count1], [obj2, count2]) => obj1 - obj2)
    .flatMap(([object, count]) => Array.fromRange(count, () => object));
  const length = array.length;
  const halfLength = length % 2 === 0 ? length / 2 : null;
  const visited = Array.fromRange(length, () => false);
  const curr = [];

  // find out which rules can be used to prune some branches
  // the sectors that have known objects in them
  const knownSectors = Array.fromRange(array.length, () => null);
  // the sectors that are known to be impossible to have certain objects in them
  const knownImpossibleSectors = Array.fromRange(array.length, () => new Set());
  // maps: end sector -> array of rules
  const surveyRules = {};
  // maps: object -> set of possible sectors
  const objectSectors = {};
  // maps: object -> { not, exactly, bandLength }
  const objectBands = {};
  // maps: object -> { yes, no }
  const adjacentObjects = {};
  // maps: object -> { yes, no }
  const oppositeObjects = {};
  for (const rule of allRules ?? []) {
    if (rule.kind === "sector") {
      if (rule.type === SectorRule.Type.SURVEY) {
        const { object } = rule;
        const { startSector, endSector, numObjects } = rule.args;
        if (startSector === endSector) {
          // only one sector
          const index = startSector - 1;
          if (numObjects === 0) {
            // cannot be in this sector
            if (knownSectors[index] === object) return;
            knownImpossibleSectors[index].add(object);
          } else if (numObjects === 1) {
            // must be in this sector
            if (knownImpossibleSectors[index].has(object)) return;
            if (knownSectors[index] == null) {
              knownSectors[index] = object;
            } else if (knownSectors[index] !== object) {
              return;
            }
          } else {
            // impossible to have more than 1 object in a single sector
            return;
          }
        } else if (startSector < endSector) {
          // doesn't handle wraparound
          if (!(endSector in surveyRules)) {
            surveyRules[endSector] = [];
          }
          surveyRules[endSector].push(rule);
        }
      } else if (rule.type === SectorRule.Type.TARGET) {
        const { object } = rule;
        const { not, sector } = rule.args;
        const index = sector - 1;
        if (not) {
          // cannot be in this sector
          if (knownSectors[index] === object) return;
          knownImpossibleSectors[index].add(object);
        } else {
          // must be in this sector
          if (knownImpossibleSectors[index].has(object)) return;
          if (knownSectors[index] == null) {
            knownSectors[index] = object;
          } else if (knownSectors[index] !== object) {
            return;
          }
        }
      }
    } else if (rule.kind === "object") {
      if (rule.atLeastOne) {
        // ignore these
      } else if (rule.type === ObjectRule.Type.IN_SECTORS) {
        const { object, not } = rule;
        const sectors = rule.args.sectors;
        if (!(object in objectSectors)) {
          objectSectors[object] = new Set(
            Array.fromRange(array.length, (index) => index + 1)
          );
        }
        // doesn't care if one rule said "must be in sectors 2 and 3" and
        // another rule said "must not be in sector 2"
        const possibleSectors = objectSectors[object];
        if (!not) {
          const intersection = new Set();
          for (const sector of sectors) {
            if (possibleSectors.has(sector)) {
              intersection.add(sector);
            }
          }
          objectSectors[object] = intersection;
        } else {
          for (const sector of sectors) {
            possibleSectors.delete(sector);
          }
        }
        if (objectSectors[object].size === 0) {
          // no possible sectors; impossible
          return;
        }
      } else if (rule.type === ObjectRule.Type.IN_BAND) {
        // won't deal with wraparound, but can eliminate some permutations
        const { object } = rule;
        const { exactly, length: bandLength } = rule.args;
        if (!(object in objectBands)) {
          objectBands[object] = { exactly, bandLength };
        } else {
          // don't handle multiple bands (too complex), but take the most
          // restrictive
          if (bandLength < objectBands[object].bandLength) {
            objectBands[object] = { exactly, bandLength };
          } else if (bandLength === objectBands[object].bandLength && exactly) {
            objectBands[object].exactly = true;
          }
        }
      } else if (rule.type === ObjectRule.Type.ADJACENT_TO) {
        const { object, not } = rule;
        const adjObject = rule.args.object;
        if (!(object in adjacentObjects)) {
          adjacentObjects[object] = { yes: [], no: new Set() };
        }
        const { yes: existingYes, no: existingNo } = adjacentObjects[object];
        if (!not) {
          if (existingNo.has(adjObject)) return;
          if (!existingYes.includes(adjObject)) {
            if (existingYes.length >= 2) {
              // cannot be adjacent to more than 2 unique objects
              return;
            }
            existingYes.push(adjObject);
          }
        } else {
          if (existingYes.includes(adjObject)) return;
          existingNo.add(adjObject);
        }
      } else if (rule.type === ObjectRule.Type.WITHIN_NUM_SECTORS) {
        // ignore these (too complex, and has wraparound)
      } else if (rule.type === ObjectRule.Type.OPPOSITE) {
        if (halfLength != null) {
          const { object, not } = rule;
          const oppObject = rule.args.object;
          if (!(object in oppositeObjects)) {
            oppositeObjects[object] = { yes: null, no: new Set() };
          }
          const { yes: existingYes, no: existingNo } = oppositeObjects[object];
          if (!not) {
            if (existingNo.has(oppObject)) return;
            if (existingYes == null) {
              oppositeObjects[object].yes = oppObject;
            } else if (existingYes !== oppObject) {
              return;
            }
          } else {
            if (existingYes === oppObject) return;
            existingNo.add(oppObject);
          }
        }
      }
    }
  }

  // turn `objectSectors` into known and impossible sectors
  for (const [objectStr, sectorsSet] of Object.entries(objectSectors)) {
    const object = Number(objectStr);
    const objectCount = counts[object];
    if (sectorsSet.size < objectCount) {
      // impossible to fit all objects in these sectors
      return;
    } else if (sectorsSet.size === objectCount) {
      // know where all the objects should be
      for (const sector of sectorsSet) {
        const index = sector - 1;
        if (knownImpossibleSectors[index].has(object)) return;
        if (knownSectors[index] == null) {
          knownSectors[index] = object;
        } else if (knownSectors[index] !== object) {
          return;
        }
      }
    } else {
      // mark all the missing sectors as impossible
      for (let i = 0; i < array.length; i++) {
        if (sectorsSet.has(i + 1)) continue;
        if (knownSectors[i] === object) return;
        knownImpossibleSectors[i].add(object);
      }
    }
  }

  console.groupCollapsed("permutation pruning helpers");
  console.log("known sectors:", knownSectors);
  console.log("known impossible sectors:", knownImpossibleSectors);
  console.log("survey rules:", surveyRules);
  console.log("object bands:", objectBands);
  console.log("adjacent rules:", adjacentObjects);
  console.log("opposite rules:", oppositeObjects);
  console.groupEnd();

  function* backtrack() {
    // check surveys
    if (!(surveyRules[curr.length] ?? []).every((rule) => rule.check(curr))) {
      return;
    }
    // check bands
    // find first and last index of each object
    const indices = {};
    for (let i = 0; i < curr.length; i++) {
      const object = curr[i];
      if (!(object in indices)) {
        indices[object] = { first: i, count: 0 };
      }
      indices[object].count++;
      indices[object].last = i;
    }
    for (const [object, { first, last, count }] of Object.entries(indices)) {
      if (count < counts[object]) continue;
      const band = objectBands[object];
      if (band == null) continue;
      const { exactly, bandLength } = band;
      if (first < bandLength - 1 && last > array.length - bandLength) {
        // might have wraparound, so don't accidentally prune it
        continue;
      }
      const objRangeLength = last - first + 1;
      if (objRangeLength > bandLength) return;
      if (exactly && objRangeLength !== bandLength) return;
    }

    // check permutation done
    if (curr.length === length) {
      yield [...curr];
      return;
    }

    // add the remaining elements
    for (let i = 0; i < length; i++) {
      if (visited[i]) continue;
      // check duplicate
      if (i > 0 && array[i] === array[i - 1] && !visited[i - 1]) continue;

      const sector = curr.length + 1;
      const object = array[i];
      // check known and impossible sectors
      if (knownImpossibleSectors[sector - 1].has(object)) continue;
      if (knownSectors[sector - 1] == null) {
      } else if (knownSectors[sector - 1] !== object) {
        // invalid sector for this object
        continue;
      }
      // check adjacent for last object
      if (curr.length >= 2) {
        const adjacent = adjacentObjects[curr[curr.length - 1]];
        if (adjacent != null) {
          const leftObject = curr[curr.length - 2];
          const rightObject = object;
          // every object that must be adjacent should appear as a neighbor
          if (
            !adjacent.yes.every((adjObject) =>
              [leftObject, rightObject].includes(adjObject)
            )
          ) {
            // violates the previous object's adjacency rule; skip it
            continue;
          }
          // every object that can't be adjacent should not be a neighbor
          let invalid = false;
          for (const forbiddenObject of adjacent.no) {
            if (forbiddenObject === leftObject) {
              // definitely not okay; just return
              return;
            }
            if (forbiddenObject === rightObject) {
              // cannot be adjacent
              invalid = true;
              break;
            }
          }
        }
      }
      // check opposite
      if (halfLength != null && curr.length >= halfLength + 1) {
        const opposite = oppositeObjects[object];
        if (opposite != null) {
          const oppObject = curr[curr.length - halfLength];
          if (!(opposite.yes === oppObject || !opposite.no.has(oppObject))) {
            // this object does not have a proper opposite object; skip it
            continue;
          }
        }
      }

      // add object
      visited[i] = true;
      curr.push(object);
      // recurse
      yield* backtrack();
      // backtrack
      visited[i] = false;
      curr.pop();
    }
  }

  yield* backtrack();
}

function getRulesKey() {
  const mode = getSelected('input[name="game-mode"]');
  if (mode == null) return "";
  return (
    mode +
    ";" +
    [...sectorRules, ...objectRules]
      .map((rule) => rule.toString())
      .sort()
      .join(";")
  );
}

function handleRuleChange() {
  // check if the possibilities need to be calculated
  const displayedRulesKey = (
    $("#possibilities-body").attr("rules-key") ?? ""
  ).trim();
  const rulesKey = getRulesKey();
  $("#calculate-possibilities-btn").toggleClass(
    "d-none",
    rulesKey === displayedRulesKey
  );
}

function resetTable(numSectors) {
  const $tableBody = $("#possibilities-body");
  // clear the table
  $tableBody.html("");

  // fix the sectors and distributions rows to have the proper number of sectors
  // sectors row
  const $sectorsRow = $("#sectors-row");
  let currNumSectors = 0;
  $sectorsRow.children().forEach(($cell) => {
    const sectorStr = $cell.attr("sector");
    if (!sectorStr) return;
    currNumSectors++;
    const sector = Number(sectorStr);
    $cell.toggleClass("d-none", !(sector <= numSectors));
  });
  if (currNumSectors < numSectors) {
    $sectorsRow.append(
      Array.fromRange(numSectors - currNumSectors, (index) => {
        const sector = currNumSectors + index + 1;
        return $(`<th>`, { scope: "col", sector }).text(`Sector ${sector}`);
      })
    );
  }
  // distributions row
  const $distributionsRow = $("#distributions-row");
  currNumSectors = 0;
  $distributionsRow.children().forEach(($cell) => {
    const sectorStr = $cell.attr("sector");
    if (!sectorStr) return;
    currNumSectors++;
    const sector = Number(sectorStr);
    $cell.toggleClass("d-none", !(sector <= numSectors));
  });
  if (currNumSectors < numSectors) {
    $distributionsRow.append(
      Array.fromRange(numSectors - currNumSectors, (index) => {
        const sector = currNumSectors + index + 1;
        return $("<th>", { scope: "col", sector });
      })
    );
  }

  return $tableBody;
}

const MAX_TABLE_ROWS = 100;
const FOR_SURE_CLASS = "table-success";

const cached = {};
function calculatePossibilities() {
  // go through sector rules and get all possible configurations
  const mode = getSelected('input[name="game-mode"]');
  if (mode == null) return;
  const modeSettings = MODE_SETTINGS[mode];
  const numSectors = modeSettings.numSectors;

  const $tableBody = resetTable(numSectors);
  // hide possibilities text
  $("#num-possibilities-text").addClass("d-none");
  // show spinner
  $("#possibilities-spinner").removeClass("d-none");

  function getSectorCells(index) {
    return $(`#possibilities-body td[sector=${Number(index) + 1}]`);
  }

  let first = true;
  const forSure = {};
  const bySector = Object.fromEntries(
    Array.fromRange(numSectors, (index) => [index, {}])
  );

  function makePossibilityRow(index, objects, dynamic = false) {
    // check each sector for ones that only have one option
    if (first) {
      for (let i = 0; i < objects.length; i++) {
        forSure[i] = objects[i];
      }
      first = false;
    } else {
      for (const [i, object] of Object.entries(forSure)) {
        if (object !== objects[i]) {
          delete forSure[i];
          if (dynamic) {
            getSectorCells(i).removeClass(FOR_SURE_CLASS);
          }
        }
      }
    }
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      bySector[i][object] = (bySector[i][object] ?? 0) + 1;
    }
    if (index > MAX_TABLE_ROWS) return null;
    return $("<tr>").append(
      $("<th>").text(index),
      objects.map((object, sector) =>
        $("<td>", {
          class: dynamic && sector in forSure ? FOR_SURE_CLASS : null,
          sector: sector + 1,
        }).append(
          $("<img>", {
            src: `images/${ObjectCode[object]}.png`,
            alt: ObjectName[object],
          }),
          " ",
          ObjectName[object]
        )
      )
    );
  }

  let total;
  let possibilities;

  const allRules = sectorRules.concat(objectRules);
  const rulesKey = getRulesKey();
  $tableBody.attr("rules-key", rulesKey);
  const cachedData = cached[rulesKey];
  if (cachedData != null) {
    const { total: cachedTotal, possibilities: cachedPossibilities } =
      cachedData;
    total = cachedTotal;
    possibilities = cachedPossibilities;
    console.log("using cached:", cachedPossibilities.length, "/", cachedTotal);
    // repopulate table
    $tableBody.append(
      possibilities.map((objects, index) =>
        makePossibilityRow(index + 1, objects)
      )
    );
    for (const i of Object.keys(forSure)) {
      getSectorCells(i).addClass(FOR_SURE_CLASS);
    }
  } else {
    const start = Date.now();
    console.group("calculating possibilities");
    total = 0;
    possibilities = [];
    let totalConsidered = 0;
    for (const objects of yieldGalaxies(
      modeSettings.counts,
      modeSettings.defaultRules.concat(allRules)
    )) {
      totalConsidered++;
      if (totalConsidered % 1000000 === 0) {
        console.log(
          "progress:",
          possibilities.length,
          "/",
          total,
          "/",
          totalConsidered
        );
      }
      // make satisfy default rules
      if (!modeSettings.defaultRules.every((rule) => rule.check(objects)))
        continue;
      total++;
      // must satisfy all rules
      if (!allRules.every((rule) => rule.check(objects))) continue;
      possibilities.push(objects);
      // add row
      $tableBody.append(
        makePossibilityRow(possibilities.length, objects, true)
      );
    }
    console.log(
      "valid possibilities:",
      possibilities.length,
      "/",
      total,
      `(total considered: ${totalConsidered})`
    );
    console.log("took", (Date.now() - start) / 1000, "seconds");
    console.groupEnd();
    cached[rulesKey] = { total, possibilities };
  }

  // update number of possibilities
  let numPossibilitiesText;
  if (possibilities.length > MAX_TABLE_ROWS) {
    numPossibilitiesText = `${MAX_TABLE_ROWS} of ${possibilities.length}`;
  } else {
    numPossibilitiesText = possibilities.length;
  }
  $("#num-possibilities-text")
    .text(
      `Showing ${numPossibilitiesText} possibilities ` +
        `(${mode.toTitleCase()} Mode)`
    )
    .removeClass("d-none");
  // update sector distributions
  if (possibilities.length === 1) {
    $("#distributions-row [sector]").html("");
  } else {
    for (const [i, sectorObjects] of Object.entries(bySector)) {
      $(`#distributions-row [sector=${Number(i) + 1}]`)
        .html("")
        .append(
          Object.entries(sectorObjects)
            // sort in decreasing order
            .sort(([obj1, count1], [obj2, count2]) => -(count1 - count2))
            .map(([obj, count]) => {
              const percent = ((count / possibilities.length) * 100).toFixed(2);
              return $("<div>").text(
                `${ObjectName[obj]}: ${count} (${percent}%)`
              );
            })
        );
    }
  }
  // hide spinner and calculate button
  $("#possibilities-spinner,#calculate-possibilities-btn").addClass("d-none");
}

function convert(array) {
  return array.map((obj) => ObjectCode[obj]);
}

$(() => {
  // initialize mode choice
  $("#game-mode-group").append(
    BootstrapHtml.radioButtonGroup(
      "game-mode",
      Object.entries(MODE_SETTINGS).map(([mode, settings]) => {
        const numSectors = Object.values(settings.counts).reduce(
          (total, count) => total + count,
          0
        );
        // cache this value
        MODE_SETTINGS[mode].numSectors = numSectors;
        return {
          id: `${mode}-mode`,
          value: mode,
          accent: settings.accent,
          content: `${mode.toTitleCase()} (${numSectors} sectors)`,
        };
      })
    )
  );
  $('input[name="game-mode"]').on("input", (event) => {
    $("#rules-row,#possibilities-row").removeClass("d-none");
    let selectedMode = null;
    for (const mode of Object.keys(MODE_SETTINGS)) {
      const checked = $(`#${mode}-mode`).prop("checked");
      $(`.${mode}-default-rule`).toggleClass("d-none", !checked);
      if (checked) selectedMode = mode;
    }
    if (selectedMode == null) return;
    const numSectors = MODE_SETTINGS[selectedMode].numSectors;

    // disable sectors in dropdown
    $("#target-sector,#end-sector")
      .find("option:not([default])")
      .forEach(($option) => {
        const value = Number($option.val());
        const valid = 1 <= value && value <= numSectors;
        $option.prop("disabled", !valid);
      });
    handleRuleChange();
  });

  function makeRuleItem(rule, { ruleClass = null, allowDelete = false } = {}) {
    const classes = ["mb-1"];
    if (ruleClass != null) {
      classes.push(ruleClass);
    }
    return $("<li>", {
      id: `${rule.kind}-rule-${rule.id}`,
      class: classes.join(" "),
    }).append(rule.createFinishedRule({ allowDelete }));
  }

  // initialize "add sector rule" input
  $("#add-sector-rule").append(
    $("<div>", { class: "col-auto" }).append(
      BootstrapHtml.radioButtonGroup(
        "sector-rule-action",
        [
          { value: "survey", content: "Survey" },
          { value: "target", content: "Target" },
        ],
        { elementAccent: "primary" }
      )
    ),
    $("<div>", { class: "col-auto" }).append(
      $("<div>", { class: "row align-items-center g-2" }).append(
        $("<div>", { class: "col-auto" }).text("Sector"),
        $("<div>", { class: "col-auto" }).append(
          BootstrapHtml.dropdown(
            Array.fromRange(18, (index) => index + 1),
            { id: "target-sector", deleteDefault: false, onlyLabels: true }
          )
        ),
        // survey end sector
        $("<div>", { class: "col-auto survey-arg d-none" }).text("to"),
        $("<div>", { class: "col-auto survey-arg d-none" }).append(
          BootstrapHtml.dropdown(
            Array.fromRange(18, (index) => index + 1),
            { id: "end-sector", deleteDefault: false, onlyLabels: true }
          )
        )
      )
    ),
    $("<div>", { class: "col-auto" }).append(
      $("<div>", { class: "row align-items-center g-2" }).append(
        // survey args
        $("<div>", { class: "col-auto survey-arg d-none" }).text("has"),
        $("<div>", { class: "col-auto survey-arg d-none" }).append(
          BootstrapHtml.input({
            type: "number",
            id: "sector-range-count",
            value: 0,
            min: 0,
            step: 1,
            validation: true,
          }).on("input", (event) => {
            const $input = $("#sector-range-count");
            $input.removeClass("is-invalid");
            try {
              const num = parseInteger($input.val());
              assert(num >= 0, "Integer must be non-negative");
            } catch (error) {
              $("#sector-range-count-feedback").text(error);
              $input.addClass("is-invalid");
              return;
            }
          })
        ),
        // target args
        $("<div>", { class: "col-auto target-arg d-none" }).append(
          BootstrapHtml.radioButtonGroup(
            "target-is-not",
            [
              { value: "is", content: "is", checked: true },
              { value: "is-not", content: "is not" },
            ],
            { elementAccent: "primary" }
          )
        ),
        // object dropdown
        $("<div>", { class: "col-auto sector-arg d-none" }).append(
          BootstrapHtml.dropdown(
            // don't include planet x because it shows up as empty
            objectDropdownOptions.filter(
              (options) => options.value !== ObjectCode[ObjectType.PLANET_X]
            ),
            { id: "sector-object", deleteDefault: false }
          )
        )
      )
    )
  );

  $('input[name="sector-rule-action"]').on("input", (event) => {
    const action = getSelected('input[name="sector-rule-action"]');
    for (const key of ["survey", "target"]) {
      $(`.${key}-arg`).toggleClass("d-none", action !== key);
    }
    $(".sector-arg").toggleClass("d-none", action == null);
  });

  function getAddingSectorRule({ create = false } = {}) {
    const action = getSelected('input[name="sector-rule-action"]');
    const sector = Number($("#target-sector").val());
    if (!sector) return null;
    const object = $("#sector-object").val();
    if (!object) return null;

    const args = {};
    if (action === "survey") {
      args.startSector = sector;
      args.endSector = Number($("#end-sector").val());
      try {
        args.numObjects = parseInteger($("#sector-range-count").val());
      } catch (error) {
        return null;
      }
    } else if (action === "target") {
      args.sector = sector;
      const isNotSelected = getSelected('input[name="target-is-not"]');
      if (isNotSelected == null) return null;
      args.not = isNotSelected === "is-not";
    } else {
      return null;
    }
    if (!create) return args;
    return new SectorRule(
      SectorRule.TypeCode.fromValue(action),
      ObjectCode.fromValue(object),
      args
    );
  }

  $("#add-sector-rule :is(input,select)").on("input", (event) => {
    $("#add-sector-rule-btn").prop("disabled", getAddingSectorRule() == null);
  });

  $("#add-sector-rule-btn").on("click", (event) => {
    const rule = getAddingSectorRule({ create: true });
    if (rule == null) return;
    // add rule to list
    sectorRules.push(rule);
    $("#sector-rules-list").append(makeRuleItem(rule, { allowDelete: true }));
    handleRuleChange();
    // reset inputs
    $('input[name="sector-rule-action"]')
      .prop("checked", false)
      .trigger("input");
    $("#target-sector").val("");
    $("#end-sector").val("");
    $("#sector-range-count").val(0);
    $("#target-is-not-is").prop("checked", true);
    $("#sector-object").val("");
  });

  // initialize object rules for each mode
  $("#object-rules-list").append(
    Object.entries(MODE_SETTINGS).flatMap(([mode, { defaultRules }]) =>
      defaultRules.map((rule) =>
        makeRuleItem(rule, { ruleClass: `${mode}-default-rule` })
      )
    )
  );

  // initialize "add object rule" input
  $("#add-object-rule").append(
    $("<div>", { class: "col-auto" }).append(
      $("<div>", { class: "row align-items-center g-2" }).append(
        $("<div>", { class: "col-auto" }).append(
          BootstrapHtml.radioButtonGroup(
            "quantity",
            [
              { value: "all", content: "All", checked: true },
              { value: "at-least-one", content: "At least one" },
            ],
            { elementAccent: "primary" }
          )
        ),
        $("<div>", { class: "col-auto" }).append(
          BootstrapHtml.dropdown(objectDropdownOptions, {
            id: "target-object",
            deleteDefault: false,
          })
        )
      )
    ),
    $("<div>", { class: "col-auto" }).append(
      $("<div>", { class: "row align-items-center g-2" }).append(
        $("<div>", { class: "col-auto" }).append(
          BootstrapHtml.radioButtonGroup(
            "is-not",
            [
              { value: "is", content: "is", checked: true },
              { value: "is-not", content: "is not" },
            ],
            { elementAccent: "primary" }
          )
        ),
        // choose object rule type
        $("<div>", { class: "col-auto" }).append(
          BootstrapHtml.dropdown(
            ObjectRule.Type.values().flatMap((ruleType) => {
              if (ruleType === ObjectRule.Type.IN_SECTORS) return [];
              return [
                {
                  value: ObjectRule.TypeCode[ruleType],
                  label: ObjectRule.RULE_ARGS[ruleType].display[0],
                },
              ];
            }),
            { id: "object-rule-type", deleteDefault: false }
          )
        )
      )
    ),
    // rule type args
    ...ObjectRule.Type.values().flatMap((ruleType) => {
      if (ruleType === ObjectRule.Type.IN_SECTORS) return [];
      return [
        $("<div>", {
          class: "col-auto object-rule-type-arg d-none",
          ruletype: ObjectRule.TypeCode[ruleType],
        }).append(
          $("<div>", { class: "row align-items-center g-2" }).append(
            ObjectRule.RULE_ARGS.createRule(ruleType).map((segment) =>
              $("<div>", { class: "col-auto" }).append(segment)
            )
          )
        ),
      ];
    })
  );

  $("#object-rule-type").on("input", (event) => {
    const ruleTypeCode = $("#object-rule-type").val();
    $(".object-rule-type-arg").forEach(($div) => {
      const show = $div.attr("ruletype") === ruleTypeCode;
      $div.toggleClass("d-none", !show);
    });
    if (ruleTypeCode === "in-band") {
      $('input:is([name="quantity"], [name="is-not"])').prop("disabled", true);
      // must be "all" and "is"
      $("#quantity-all,#is-not-is").prop("checked", true);
    } else {
      $('input:is([name="quantity"], [name="is-not"])').prop("disabled", false);
    }
  });

  function getAddingObjectRule({ create = false } = {}) {
    const quantitySelected = getSelected('input[name="quantity"]');
    if (quantitySelected == null) return null;
    const object = $("#target-object").val();
    if (!object) return null;
    const isNotSelected = getSelected('input[name="is-not"]');
    if (isNotSelected == null) return null;
    const ruleTypeCode = $("#object-rule-type").val();
    if (!ruleTypeCode) return null;

    const ruleType = ObjectRule.TypeCode.fromValue(ruleTypeCode);
    const ruleArgs = ObjectRule.RULE_ARGS[ruleType].args;
    const args = {
      atLeastOne: quantitySelected === "at-least-one",
      not: isNotSelected === "is-not",
    };
    for (const [argName, argSettings] of Object.entries(ruleArgs)) {
      let value = $(`#${ruleTypeCode}-${argName}`).val();
      try {
        if (argSettings.transform) {
          value = argSettings.transform(value);
        }
        argSettings.validate?.(value);
      } catch (error) {
        // not yet valid; do nothing
        return null;
      }
      args[argName] = value;
    }
    if (!create) return args;
    return new ObjectRule(ObjectCode.fromValue(object), ruleType, args);
  }

  $("#add-object-rule :is(input,select)").on("input", (event) => {
    $("#add-object-rule-btn").prop("disabled", getAddingObjectRule() == null);
  });

  $("#add-object-rule-btn").on("click", (event) => {
    const rule = getAddingObjectRule({ create: true });
    if (rule == null) return;
    // add rule to list
    objectRules.push(rule);
    $("#object-rules-list").append(makeRuleItem(rule, { allowDelete: true }));
    handleRuleChange();
    // reset inputs
    $("#quantity-all").prop("checked", true);
    $("#target-object").val("");
    $("#is-not-is").prop("checked", true);
    $("#object-rule-type").val("").trigger("input");
    $("#add-object-rule :is(input,select)").trigger("reset");
  });

  $("#calculate-possibilities-btn").on("click", (event) => {
    calculatePossibilities();
  });
});
