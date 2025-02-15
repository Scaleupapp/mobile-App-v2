import React from 'react';
// eslint-disable-next-line no-restricted-imports
import { Text as RCAText, StyleProp, TextProps, TextStyle } from 'react-native';
import { NativeText } from 'react-native/Libraries/Text/TextNativeComponent';
import { nh, nw } from '../helper/scales';
import { APP_FONTS } from '../assets/fonts';
import { COLORS } from '../helper/colors';


/**
 * This import of Text avoids one level of depth of re-rendering.
 * https://x.com/todor_one/status/1695643822615622006?s=20
 *
 */
const LeanText = ({ children, ...restProps }: TextProps) => (
    <NativeText {...restProps}>{children}</NativeText>
);

const useTextVariants = () => {

    return {
        medium12: {
            fontSize: nh(12),
            fontFamily: APP_FONTS.PoppinsMedium,
            lineHeight: nh(18),
            letterSpacing: nw(0.3),
            fontWeight: '500',

        },
        medium14: {
            fontSize: nh(14),
            fontFamily: APP_FONTS.PoppinsMedium,
            lineHeight: nh(21),
            letterSpacing: nw(0.25),
            fontWeight: '500',

        },
        medium16: {
            fontSize: nh(16),
            fontFamily: APP_FONTS.PoppinsMedium,
            lineHeight: nh(24),
            letterSpacing: nw(0.25),
            fontWeight: '500',

        },
        semibold12: {
            fontSize: nh(12),
            fontFamily: APP_FONTS.PoppinsSemiBold,
            lineHeight: nh(18),
            letterSpacing: nw(0.3),
            fontWeight: '600',
        },
        semibold14: {
            fontSize: nh(14),
            fontFamily: APP_FONTS.PoppinsSemiBold,
            lineHeight: nh(21),
            letterSpacing: nw(0.3),
            fontWeight: '600',
        },
        semibold16: {
            fontSize: nh(16),
            fontFamily: APP_FONTS.PoppinsSemiBold,
            lineHeight: nh(24),
            letterSpacing: nw(0.3),
            fontWeight: '600',
        },

        semibold18: {
            fontSize: nh(18),
            fontFamily: APP_FONTS.PoppinsSemiBold,
            lineHeight: nh(27),
            letterSpacing: nw(0.15),
            fontWeight: '600',
        },
        semibold20: {
            fontSize: nh(20),
            fontFamily: APP_FONTS.PoppinsSemiBold,
            lineHeight: nh(30),
            letterSpacing: nw(0.15),
            fontWeight: '600',
        },
        bold32: {
            fontSize: nh(32),
            fontFamily: APP_FONTS.PoppinsBold,
            // lineHeight: nh(30),
            // letterSpacing: nw(0.15),
            fontWeight: '800',
        },
        bold22: {
            fontSize: nh(22),
            fontFamily: APP_FONTS.PoppinsBold,
            // lineHeight: nh(30),
            // letterSpacing: nw(0.15),
            fontWeight: '700',
        },
        bold20: {
            fontSize: nh(20),
            fontFamily: APP_FONTS.PoppinsBold,
            lineHeight: nh(30),
            letterSpacing: nw(0.15),
            fontWeight: '700',
        },
        bold12: {
            fontSize: nh(12),
            fontFamily: APP_FONTS.PoppinsBold,
            lineHeight: nh(18),
            letterSpacing: nw(0.15),
            fontWeight: '700',
        },

    }
};

const Text = ({
    as = 'LeanText',
    variant = 'bodyMedium',
    style,
    children,
    color = COLORS.grey999999,
    ...rest
}: {
    as?: 'LeanText' | 'RCAText';
    variant?: keyof ReturnType<typeof useTextVariants>;
    style?: StyleProp<TextStyle>;
    color?: string;
} & TextProps) => {
    const TextComponent = as === 'LeanText' ? LeanText : RCAText;
    const textVariants = useTextVariants();
    const defaultStyle = textVariants[variant];
    return (
        <TextComponent style={[defaultStyle, { color }, style]} {...rest}>
            {children}
        </TextComponent>
    );
};

export default Text;