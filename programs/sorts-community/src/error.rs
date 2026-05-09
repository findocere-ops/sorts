use quasar_lang::prelude::*;

#[repr(u32)]
#[derive(Clone, Copy)]
pub enum SortsError {
    InvalidTierCount = 0x2000,
    InvalidTierLevel = 0x2001,
    Underpaid = 0x2002,
    AlreadySubscribed = 0x2003,
    NoSubscription = 0x2004,
    MathOverflow = 0x2005,
    UnauthorizedTreasury = 0x2006,
    UnauthorizedCreator = 0x2007,
    InvalidCommunity = 0x2008,
}

impl From<SortsError> for ProgramError {
    fn from(e: SortsError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
