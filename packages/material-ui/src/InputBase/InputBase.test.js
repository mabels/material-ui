import React from 'react';
import PropTypes from 'prop-types';
import { assert } from 'chai';
import { spy } from 'sinon';
import {
  createMount,
  findOutermostIntrinsic,
  getClasses,
  unwrap,
} from '@material-ui/core/test-utils';
import FormControlContext from '../FormControl/FormControlContext';
import InputAdornment from '../InputAdornment';
import Textarea from './Textarea';
import InputBase from './InputBase';

describe('<InputBase />', () => {
  let classes;
  let mount;
  const NakedInputBase = unwrap(InputBase);

  function setState(wrapper, state) {
    return wrapper.find('InputBase').setState(state);
  }

  before(() => {
    mount = createMount();
    classes = getClasses(<InputBase />);
  });

  after(() => {
    mount.cleanUp();
  });

  it('should render a <div />', () => {
    const wrapper = mount(<InputBase />);
    assert.strictEqual(findOutermostIntrinsic(wrapper).name(), 'div');
    assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.root), true);
  });

  it('should render an <input /> inside the div', () => {
    const wrapper = mount(<InputBase />);
    const input = wrapper.find('input');
    assert.strictEqual(input.name(), 'input');
    assert.strictEqual(input.props().type, 'text');
    assert.strictEqual(input.hasClass(classes.input), true);
    assert.strictEqual(input.props().required, undefined);
  });

  describe('multiline', () => {
    it('should render an <Textarea /> when passed the multiline prop', () => {
      const wrapper = mount(<InputBase multiline />);
      assert.strictEqual(wrapper.find(Textarea).length, 1);
    });

    it('should render an <textarea /> when passed the multiline and rows props', () => {
      const wrapper = mount(<InputBase multiline rows="4" />);
      assert.strictEqual(wrapper.find('textarea').length, 1);
    });

    it('should forward the value to the Textarea', () => {
      const wrapper = mount(<InputBase multiline rowsMax="4" value="" />);
      assert.strictEqual(wrapper.find(Textarea).props().value, '');
    });
  });

  describe('prop: disabled', () => {
    it('should render a disabled <input />', () => {
      const wrapper = mount(<InputBase disabled />);
      const input = wrapper.find('input');
      assert.strictEqual(input.name(), 'input');
      assert.strictEqual(input.hasClass(classes.input), true);
      assert.strictEqual(input.hasClass(classes.disabled), true);
    });

    it('should reset the focused state', () => {
      const handleBlur = spy();
      const wrapper = mount(<InputBase muiFormControl={{ onBlur: handleBlur }} />);
      // We simulate a focused input that is getting disabled.
      setState(wrapper, {
        focused: true,
      });
      wrapper.setProps({
        disabled: true,
      });
      assert.strictEqual(wrapper.find('InputBase').state().focused, false);
      assert.strictEqual(handleBlur.callCount, 1);
    });

    // IE 11 bug
    it('should not respond the focus event when disabled', () => {
      const wrapper = mount(<InputBase disabled />);
      const event = {
        stopPropagation: spy(),
      };
      wrapper.find('input').simulate('focus', event);
      assert.strictEqual(event.stopPropagation.callCount, 1);
    });
  });

  it('should fire event callbacks', () => {
    const events = ['onChange', 'onFocus', 'onBlur', 'onKeyUp', 'onKeyDown'];
    const handlers = events.reduce((result, n) => {
      result[n] = spy();
      return result;
    }, {});

    const wrapper = mount(<InputBase {...handlers} />);

    events.forEach(n => {
      const event = n.charAt(2).toLowerCase() + n.slice(3);
      wrapper.find('input').simulate(event);
      assert.strictEqual(handlers[n].callCount, 1, `should have called the ${n} handler`);
    });
  });

  describe('controlled', () => {
    it('should considered [] as controlled', () => {
      const wrapper = mount(<InputBase value={[]} />);
      const instance = wrapper.find('InputBase').instance();
      assert.strictEqual(instance.isControlled, true);
    });

    ['', 0].forEach(value => {
      describe(`${typeof value} value`, () => {
        let wrapper;
        let handleFilled;
        let handleEmpty;

        before(() => {
          handleEmpty = spy();
          handleFilled = spy();
          wrapper = mount(
            <InputBase value={value} onFilled={handleFilled} onEmpty={handleEmpty} />,
          );
        });

        it('should check that the component is controlled', () => {
          const instance = wrapper.find('InputBase').instance();
          assert.strictEqual(instance.isControlled, true);
        });

        // don't test number because zero is a empty state, whereas '' is not
        if (typeof value !== 'number') {
          it('should have called the handleEmpty callback', () => {
            assert.strictEqual(handleEmpty.callCount, 1);
          });

          it('should fire the onFilled callback when dirtied', () => {
            assert.strictEqual(handleFilled.callCount, 0);
            wrapper.setProps({ value: typeof value === 'number' ? 2 : 'hello' });
            assert.strictEqual(handleFilled.callCount, 1);
          });

          it('should fire the onEmpty callback when dirtied', () => {
            assert.strictEqual(handleEmpty.callCount, 1);
            wrapper.setProps({ value });
            assert.strictEqual(handleEmpty.callCount, 2);
          });
        }
      });
    });
  });

  describe('prop: inputComponent', () => {
    it('should accept any html component', () => {
      const wrapper = mount(<InputBase inputComponent="span" />);
      assert.strictEqual(wrapper.find('span').length, 1);
    });

    it('should inject onBlur and onFocus', () => {
      let injectedProps;
      function MyInputBase(props) {
        injectedProps = props;
        const { inputRef, ...other } = props;
        return <input ref={inputRef} {...other} />;
      }

      MyInputBase.propTypes = {
        inputRef: PropTypes.func.isRequired,
      };

      mount(<InputBase inputComponent={MyInputBase} />);
      assert.strictEqual(typeof injectedProps.onBlur, 'function');
      assert.strictEqual(typeof injectedProps.onFocus, 'function');
    });
  });

  // Note the initial callback when
  // uncontrolled only fires for a full mount
  describe('uncontrolled', () => {
    let wrapper;
    let handleFilled;
    let handleEmpty;

    before(() => {
      handleEmpty = spy();
      handleFilled = spy();
      wrapper = mount(
        <NakedInputBase
          classes={{}}
          onFilled={handleFilled}
          defaultValue="hell"
          onEmpty={handleEmpty}
        />,
      );
    });

    it('should check that the component is uncontrolled', () => {
      const instance = wrapper.find('InputBase').instance();
      assert.strictEqual(instance.isControlled, false);
    });

    it('should fire the onFilled callback when dirtied', () => {
      assert.strictEqual(handleFilled.callCount, 1);
      wrapper.find('InputBase').instance().inputRef.value = 'hello';
      wrapper.find('input').simulate('change');
      assert.strictEqual(handleFilled.callCount, 2);
    });

    it('should fire the onEmpty callback when cleaned', () => {
      // Because of mount() this hasn't fired since there is no mounting
      assert.strictEqual(handleEmpty.callCount, 0);
      wrapper.find('InputBase').instance().inputRef.value = '';
      wrapper.find('input').simulate('change');
      assert.strictEqual(handleEmpty.callCount, 1);
    });
  });

  describe('with muiFormControl context', () => {
    let wrapper;
    let muiFormControl;

    function setFormControlContext(muiFormControlContext) {
      muiFormControl = muiFormControlContext;
      wrapper.setProps({ context: muiFormControlContext });
    }

    beforeEach(() => {
      // we need a class for enzyme otherwise: "Can't call ::setState on functional component"
      /* eslint-disable-next-line react/prefer-stateless-function */
      class Provider extends React.Component {
        render() {
          const { context, ...other } = this.props;

          return (
            <FormControlContext.Provider value={context}>
              <InputBase {...other} />
            </FormControlContext.Provider>
          );
        }
      }
      Provider.propTypes = {
        context: PropTypes.object,
      };

      wrapper = mount(<Provider />);
    });

    it('should have the formControl class', () => {
      setFormControlContext({});
      assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.formControl), true);
    });

    describe('callbacks', () => {
      let focus;

      beforeEach(() => {
        focus = spy();
        wrapper.find('InputBase').instance().inputRef = { value: '', focus };
        setFormControlContext({
          onFilled: spy(),
          onEmpty: spy(),
          onFocus: spy(),
          onBlur: spy(),
        });
      });

      it('should fire the onFilled muiFormControl and props callback when dirtied', () => {
        const handleFilled = spy();
        wrapper.setProps({
          onFilled: handleFilled,
        });

        wrapper.find('InputBase').instance().inputRef.value = 'hello';
        wrapper.find('input').simulate('change');
        assert.strictEqual(handleFilled.callCount, 1);
        assert.strictEqual(muiFormControl.onFilled.callCount, 1);
      });

      it('should fire the onEmpty muiFormControl and props callback when cleaned', () => {
        const handleEmpty = spy();
        wrapper.setProps({
          onEmpty: handleEmpty,
        });

        wrapper.find('InputBase').instance().inputRef.value = '';
        wrapper.find('input').simulate('change');
        assert.strictEqual(handleEmpty.callCount, 1);
        assert.strictEqual(muiFormControl.onEmpty.callCount, 1);
      });

      it('should fire the onFocus muiFormControl', () => {
        const handleFocus = spy();
        wrapper.setProps({
          onFocus: handleFocus,
        });

        wrapper.find('input').simulate('focus');
        assert.strictEqual(handleFocus.callCount, 1);
        assert.strictEqual(muiFormControl.onFocus.callCount, 1);
      });

      it('should fire the onBlur muiFormControl', () => {
        const handleBlur = spy();
        wrapper.setProps({
          onBlur: handleBlur,
        });

        wrapper.find('input').simulate('blur');
        assert.strictEqual(handleBlur.callCount, 1);
        assert.strictEqual(muiFormControl.onBlur.callCount, 1);
      });

      it('should focus and fire the onClick prop', () => {
        const event = {};
        const handleClick = spy();
        wrapper.setProps({
          onClick: handleClick,
        });

        wrapper.find('div').simulate('click', event);
        assert.strictEqual(handleClick.callCount, 1);
        assert.strictEqual(focus.callCount, 1);
      });
    });

    describe('error', () => {
      beforeEach(() => {
        setFormControlContext({ error: true });
      });

      it('should have the error class', () => {
        assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.error), true);
      });

      it('should be overridden by props', () => {
        assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.error), true);
        wrapper.setProps({ error: false });
        assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.error), false);
        wrapper.setProps({ error: true });
        assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.error), true);
      });
    });

    describe('margin', () => {
      describe('context margin: dense', () => {
        beforeEach(() => {
          setFormControlContext({ margin: 'dense' });
        });

        it('should have the inputMarginDense class', () => {
          assert.strictEqual(wrapper.find('input').hasClass(classes.inputMarginDense), true);
        });
      });

      it('should be overridden by props', () => {
        assert.strictEqual(wrapper.find('input').hasClass(classes.inputMarginDense), false);
        wrapper.setProps({ margin: 'dense' });
        assert.strictEqual(wrapper.find('input').hasClass(classes.inputMarginDense), true);
      });
    });

    describe('required', () => {
      it('should have the aria-required prop with value true', () => {
        setFormControlContext({ required: true });
        const input = wrapper.find('input');
        assert.strictEqual(input.props().required, true);
      });
    });

    describe('focused', () => {
      it('prioritizes context focus', () => {
        setState(wrapper, { focused: true });

        setFormControlContext({ focused: false });
        assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.focused), false);

        setFormControlContext({ focused: true });
        assert.strictEqual(findOutermostIntrinsic(wrapper).hasClass(classes.focused), true);
      });
    });
  });

  describe('componentDidMount', () => {
    let wrapper;
    let instance;

    before(() => {
      wrapper = mount(<NakedInputBase classes={classes} />);
      instance = wrapper.find('InputBase').instance();
    });

    beforeEach(() => {
      instance.checkDirty = spy();
    });

    it('should not call checkDirty if controlled', () => {
      instance.isControlled = true;
      instance.componentDidMount();
      assert.strictEqual(instance.checkDirty.callCount, 0);
    });

    it('should call checkDirty if controlled', () => {
      instance.isControlled = false;
      instance.componentDidMount();
      assert.strictEqual(instance.checkDirty.callCount, 1);
    });

    it('should call checkDirty with input value', () => {
      instance.isControlled = false;
      instance.inputRef = 'woofinput';
      instance.componentDidMount();
      assert.strictEqual(instance.checkDirty.calledWith(instance.inputRef), true);
    });

    it('should call or not call checkDirty consistently', () => {
      instance.isControlled = true;
      instance.componentDidMount();
      assert.strictEqual(instance.checkDirty.callCount, 0);
      instance.isControlled = false;
      instance.componentDidMount();
      assert.strictEqual(instance.checkDirty.callCount, 1);
      instance.isControlled = true;
      instance.componentDidMount();
      assert.strictEqual(instance.checkDirty.callCount, 1);
    });
  });

  describe('mount', () => {
    it('should be able to access the native input', () => {
      const handleRef = spy();
      mount(<InputBase inputRef={handleRef} />);
      assert.strictEqual(handleRef.callCount, 1);
    });

    it('should be able to access the native textarea', () => {
      const handleRef = spy();
      mount(<InputBase multiline inputRef={handleRef} />);
      assert.strictEqual(handleRef.callCount, 1);
    });
  });

  describe('prop: inputProps', () => {
    it('should apply the props on the input', () => {
      const wrapper = mount(<InputBase inputProps={{ className: 'foo', maxLength: 5 }} />);
      const input = wrapper.find('input');
      assert.strictEqual(input.hasClass('foo'), true);
      assert.strictEqual(input.hasClass(classes.input), true);
      assert.strictEqual(input.props().maxLength, 5);
    });

    it('should be able to get a ref', () => {
      const handleRef = spy();
      mount(<InputBase inputProps={{ ref: handleRef }} />);
      assert.strictEqual(handleRef.callCount, 1);
    });
  });

  describe('prop: startAdornment, prop: endAdornment', () => {
    it('should render adornment before input jsx', () => {
      const wrapper = mount(
        <InputBase startAdornment={<InputAdornment position="start">$</InputAdornment>} />,
      );

      assert.strictEqual(
        findOutermostIntrinsic(wrapper)
          .childAt(0)
          .type(),
        InputAdornment,
      );
    });

    it('should render adornment after input jsx', () => {
      const wrapper = mount(
        <InputBase endAdornment={<InputAdornment position="end">$</InputAdornment>} />,
      );

      assert.strictEqual(
        findOutermostIntrinsic(wrapper)
          .childAt(1)
          .type(),
        InputAdornment,
      );
    });


    it('should render adornment before input string', () => {
      const id = `id:${Math.random()}`;
      const wrapper = mount(
        <InputBase startAdornment={id} />,
      );

      assert.include(wrapper.html(), id);
    });

    it('should render adornment after input string', () => {
      const id = `id:${Math.random()}`;
      const wrapper = mount(
        <InputBase endAdornment={id} />,
      );

      assert.include(wrapper.html(), id);
    });


    const StartHelloWorld = (props) => <div>{props.helloWorld || 'START'}</div>;
    StartHelloWorld.propTypes = {
        helloWorld: PropTypes.string
    }
    const EndHelloWorld = (props) => <div>{props.helloWorld || 'END'}</div>;
    EndHelloWorld.propTypes = {
        helloWorld: PropTypes.string
    }

    it('should allow react component as value', () => {
      const wrapper = mount(
        <>
        <InputBase
          startAdornment={StartHelloWorld}
          endAdornment={EndHelloWorld}
        />
        </>
      );
      assert.equal(wrapper.find(StartHelloWorld).text(), 'START');
      assert.equal(wrapper.find(EndHelloWorld).text(), 'END');
    });

    it('should allow react component as value with props', () => {
      const wrapper = mount(
        <>
        <InputBase
          startAdornment={StartHelloWorld}
          startAdornmentProps={{ helloWorld: 'start' }}
          endAdornment={EndHelloWorld}
          endAdornmentProps={{ helloWorld: 'end' }}
        />
        </>
      );
      assert.equal(wrapper.find(StartHelloWorld).text(), 'start');
      assert.equal(wrapper.find(EndHelloWorld).text(), 'end');
    });

  });

  describe('prop: inputRef', () => {
    it('should be able to return the input node via a ref object', () => {
      const ref = React.createRef();
      mount(<InputBase inputRef={ref} />);
      assert.strictEqual(ref.current.tagName, 'INPUT');
    });

    it('should be able to return the textarea node via a ref object', () => {
      const ref = React.createRef();
      mount(<InputBase multiline inputRef={ref} />);
      assert.strictEqual(ref.current.tagName, 'TEXTAREA');
    });
  });
});
